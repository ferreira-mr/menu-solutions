import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import {
  getTodasTurmas,
  getTodasContagensDeHoje,
  getTodasNecessidades,
  getNecessidadeComAlunos,
  getTodosCronograma,
  saveContagemOperation,
  getTodosAlunosContagemNes,
  fetchProtectedAsset,
} from '../../services/api';
import placeholderAvatar from '../../assets/img/avatar.png';
import { createDomElement } from '../../utils/safeDom';
import { useSchoolCalendar } from '../../features/contagem/useSchoolCalendar';
import { getSchoolDateFromInstant, selectEffectiveContagens } from '../../features/contagem/schoolCalendar';
import { summarizeContagemTotals } from '../../features/contagem/countTotals';
import './ContagemPage.css';

const createIdempotencyKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : ((random & 0x3) | 0x8);
    return value.toString(16);
  });
};

const ContagemPage = () => {
  const [turmas, setTurmas] = useState([]);
  const [contagens, setContagens] = useState([]);
  const [necessidades, setNecessidades] = useState([]);
  const [alunosNesDeHoje, setAlunosNesDeHoje] = useState([]);
  const [idsAlunosNoCronograma, setIdsAlunosNoCronograma] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { schoolDay: hoje, timezone, weekdayName } = useSchoolCalendar();

  const carregarDados = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [turmasRes, contagensRes, necessidadesRes, cronogramaRes, alunosNesRes] = await Promise.all([
        getTodasTurmas(),
        getTodasContagensDeHoje(hoje),
        getTodasNecessidades(),
        getTodosCronograma(),
        getTodosAlunosContagemNes(hoje)
      ]);

      setTurmas(turmasRes || []);
      setContagens(contagensRes || []);
      setNecessidades(necessidadesRes || []);

      const apenasHoje = (alunosNesRes || []).filter(nes => {
        const dataRegistro = nes.data_hora_contagem || (nes.contagem && nes.contagem.data_contagem);
        return getSchoolDateFromInstant(dataRegistro, timezone) === hoje;
      });
      setAlunosNesDeHoje(apenasHoje);

      const cronogramaDeHoje = (cronogramaRes || []).find(d => d.dia.toLowerCase() === weekdayName);

      const idsDeHoje = new Set();
      if (cronogramaDeHoje?.alunos) {
        cronogramaDeHoje.alunos.forEach(a => { if (a.aluno_id) idsDeHoje.add(a.aluno_id); });
      }
      setIdsAlunosNoCronograma(idsDeHoje);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [hoje, timezone, weekdayName]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const contagensEfetivasDeHoje = useMemo(
    () => selectEffectiveContagens(contagens, hoje),
    [contagens, hoje],
  );

  const totaisContagem = useMemo(
    () => summarizeContagemTotals(contagensEfetivasDeHoje, hoje),
    [contagensEfetivasDeHoje, hoje],
  );

  const getContagemDaTurma = useCallback(turmaId => {
    return contagensEfetivasDeHoje.find(c => Number(c.turmas_id) === Number(turmaId)) || null;
  }, [contagensEfetivasDeHoje]);

  const abrirModalContagem = async turma => {
    const contagemAtual = getContagemDaTurma(turma.id);
    const quantidadeInicial = Number(contagemAtual?.qtd_contagem || 0);

    Swal.fire({ title: 'Preparando Contagem...', didOpen: () => Swal.showLoading() });

    try {
      const necessidadesComAlunos = await Promise.all(necessidades.map(n => getNecessidadeComAlunos(n.id)));
      let alunosParaExibir = [];

      necessidadesComAlunos.forEach(nec => {
        (nec?.alunos || []).forEach(aluno => {
          if (aluno?.turmas_id === turma.id) {
            const isNAE = ['NAI', 'NAE'].includes(String(nec?.necessidade || '').trim().toUpperCase());
            const isInCronograma = idsAlunosNoCronograma.has(aluno.id);
            const relacaoId = aluno.alunos_has_necessidades_id;
            if (!relacaoId) {
              console.error('Não foi possível preparar a presença NES: relação ausente.', aluno);
              return;
            }
            if (isNAE || isInCronograma) {
              alunosParaExibir.push({
                ...aluno,
                necessidade_id: nec?.id,
                necessidade_nome: nec?.necessidade,
                relacao_id: String(relacaoId)
              });
            }
          }
        });
      });

      Swal.close?.();

      const relacoesDaTurma = new Set(alunosParaExibir.map(aluno => String(aluno.relacao_id)));
      const presencasConfirmadas = new Map();
      alunosNesDeHoje.forEach(nes => {
        const relacaoId = String(nes.relacao_id || '');
        if (relacoesDaTurma.has(relacaoId) && nes.id) {
          presencasConfirmadas.set(relacaoId, Number(nes.id));
        }
      });
      const selecoesDoRascunho = new Set(presencasConfirmadas.keys());
      let ultimoPayload = null;
      let ultimaChave = null;
      let salvamentoEmAndamento = false;
      const photoObjectUrls = new Set();
      const photoControllers = new Set();

      const modalContent = createDomElement('div');
      const contador = createDomElement('div', { className: 'contador' }, [
        createDomElement('button', { id: 'menos', className: 'btn-contador', textContent: '-' }),
        createDomElement('input', {
          type: 'number',
          id: 'contadorValor',
          className: 'contador-input',
          value: quantidadeInicial,
        }),
        createDomElement('button', { id: 'mais', className: 'btn-contador', textContent: '+' }),
      ]);
      const listaNes = createDomElement('div', { className: 'lista-nes' });
      const itemDomIds = new Map();

      necessidades.forEach(n => {
        const alunosDoGrupo = alunosParaExibir.filter(a => a.necessidade_id === n.id);
        if (alunosDoGrupo.length === 0) return;

        const grupo = createDomElement('div', { className: 'nes-group' }, [
          createDomElement('h4', { textContent: n.necessidade }),
        ]);

        alunosDoGrupo.forEach(a => {
          const relId = String(a.relacao_id);
          const itemDomId = `nes-item-${relId.replace(/[^A-Za-z0-9_-]/g, '-')}`;
          const ativo = selecoesDoRascunho.has(relId);
          itemDomIds.set(relId, itemDomId);
          const switchInput = createDomElement('input', {
            type: 'checkbox',
            className: 'check-nes',
            checked: ativo,
            dataset: { relid: relId },
          });
          const item = createDomElement('div', {
            className: `nes-item ${ativo ? 'ativo' : ''}`,
            id: itemDomId,
          }, [
            createDomElement('img', {
              src: placeholderAvatar,
              dataset: { photoUrl: a.foto_url || (a.foto && a.id ? `/api/alunos/${a.id}/foto` : '') },
              alt: a.nome || 'Aluno',
            }),
            createDomElement('span', { textContent: a.nome }),
            createDomElement('label', { className: 'switch' }, [
              switchInput,
              createDomElement('span', { className: 'slider' }),
            ]),
          ]);
          grupo.append(item);
        });
        listaNes.append(grupo);
      });

      modalContent.append(
        contador,
        createDomElement('h3', { className: 'titulo-nes', textContent: 'Necessidades Especiais' }),
        listaNes,
      );

      await Swal.fire({
        titleText: `Contagem - ${turma.nome_turma}`,
        html: modalContent,
        confirmButtonText: 'Salvar',
        confirmButtonColor: '#198754',
        showCancelButton: true,
        cancelButtonText: 'Fechar',
        cancelButtonColor: '#dc3545',
        reverseButtons: true,
        didOpen: () => {
          const container = Swal.getHtmlContainer?.() || document;
          const input = container.querySelector('#contadorValor');
          container.querySelector('#menos').onclick = () => input.value = Math.max(0, (parseInt(input.value, 10) || 0) - 1);
          container.querySelector('#mais').onclick = () => input.value = (parseInt(input.value, 10) || 0) + 1;

          container.querySelectorAll('.check-nes').forEach(chk => {
            chk.onchange = e => {
              const relId = String(e.target.dataset.relid);
              const itemDiv = document.getElementById(itemDomIds.get(relId));
              if (e.target.checked) selecoesDoRascunho.add(relId);
              else selecoesDoRascunho.delete(relId);
              itemDiv?.classList.toggle('ativo', e.target.checked);
            };
          });

          container.querySelectorAll('img[data-photo-url]').forEach(image => {
            const photoUrl = image.dataset.photoUrl;
            if (!photoUrl || typeof fetchProtectedAsset !== 'function') return;

            const controller = new AbortController();
            photoControllers.add(controller);
            fetchProtectedAsset(photoUrl, { signal: controller.signal })
              .then(blob => {
                const objectUrl = URL.createObjectURL(blob);
                photoObjectUrls.add(objectUrl);
                if (image.isConnected) image.src = objectUrl;
                else URL.revokeObjectURL(objectUrl);
              })
              .catch(error => {
                if (error?.name !== 'AbortError') console.error(error);
              })
              .finally(() => photoControllers.delete(controller));
          });
        },
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading?.(),
        preConfirm: async () => {
          const container = Swal.getHtmlContainer?.() || document;
          const quantidadeFinal = Number.parseInt(container.querySelector('#contadorValor')?.value, 10);

          if (!Number.isInteger(quantidadeFinal) || quantidadeFinal < 0) {
            Swal.showValidationMessage?.('Informe uma quantidade inteira igual ou maior que zero.');
            return false;
          }
          if (salvamentoEmAndamento) return false;

          const presencas = alunosParaExibir
            .map(aluno => {
              const relacaoId = String(aluno.relacao_id);
              const presente = selecoesDoRascunho.has(relacaoId);
              const estavaPresente = presencasConfirmadas.has(relacaoId);

              if (presente === estavaPresente) return null;

              return {
                relacao_id: Number(relacaoId),
                presenca_id: presencasConfirmadas.get(relacaoId) || null,
                presente,
              };
            })
            .filter(Boolean);
          const payload = {
            contagem_id: contagemAtual?.id || null,
            turmas_id: turma.id,
            qtd_contagem: quantidadeFinal,
            presencas,
          };
          const payloadAtual = JSON.stringify(payload);

          if (payloadAtual !== ultimoPayload) {
            ultimoPayload = payloadAtual;
            ultimaChave = createIdempotencyKey();
          }

          salvamentoEmAndamento = true;
          try {
            const resposta = await saveContagemOperation(payload, ultimaChave);
            return resposta?.data || resposta;
          } catch (error) {
            Swal.hideLoading?.();
            Swal.showValidationMessage?.(error?.message || 'Não foi possível salvar a contagem.');
            return false;
          } finally {
            salvamentoEmAndamento = false;
          }
        }
      }).then(async result => {
        if (result.isConfirmed) await carregarDados(false);
      }).finally(() => {
        photoControllers.forEach(controller => controller.abort());
        photoObjectUrls.forEach(objectUrl => URL.revokeObjectURL(objectUrl));
        photoObjectUrls.clear();
      });
    } catch (error) {
      console.error("Erro no fluxo de contagem:", error);
      Swal.fire('Erro!', error?.message || 'Não foi possível preparar a contagem. Tente novamente.', 'error');
    }
  };

  if (loading) return <div className="carregando"><div className="spinner"></div><p>Carregando...</p></div>;

  return (
    <section className="contagem-section">
      <div className="total-geral">
        <div className="totais-cabecalho"><i className="bi bi-people-fill"></i> <span>Totais de Alunos Hoje</span></div>
        <div className="totais-valores">
          <span>Regular: <strong>{totaisContagem.total_regular}</strong></span>
          <span>Outros: <strong>{totaisContagem.total_outros}</strong></span>
          <span>Combinado: <strong>{totaisContagem.total_combinado}</strong></span>
        </div>
      </div>
      <div className="turmas-grid">
        {turmas.map(turma => {
          const contagem = getContagemDaTurma(turma.id);
          return (
            <button key={turma.id} className={`turma-card ${contagem ? 'tem-contagem' : 'sem-contagem'}`} onClick={() => abrirModalContagem(turma)}>
              <span className="turma-nome-display">{turma.nome_turma}</span>
              <span className="turma-contagem-display">{contagem ? `${contagem.qtd_contagem} alunos` : 'Fazer Contagem'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ContagemPage;
