import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    getTodasNecessidades, addNecessidade, updateNecessidade, deleteNecessidade,
    getTodosAlunos, addAluno, updateAluno, deleteAluno, getTodasTurmas,
    associarNecessidadesAoAluno, desassociarAlunoDaNecessidade, uploadAlunoFoto,
    getNecessidadeComAlunos, agendarRelacaoNosDias, getTodosCronograma, removerAgendamentoDoDia
} from '../../services/api';
import placeholderAvatar from '../../assets/img/avatar.png';
import { createDomElement, createSelect } from '../../utils/safeDom';
import ProtectedStudentPhoto from '../../components/common/ProtectedStudentPhoto';
import './PlanejamentoPage.css';

// --- COMPONENTES AUXILIARES ---

const SearchBar = ({ searchTerm, setSearchTerm, placeholder }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="search-container">
            <input 
                type="search" 
                placeholder={placeholder}
                className={`search-input ${isExpanded ? 'expanded' : ''}`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => { if(!searchTerm) setIsExpanded(false); }}
                onFocus={() => setIsExpanded(true)}
            />
            <button className="search-icon" onClick={() => setIsExpanded(true)}>
                <i className="bi bi-search"></i>
            </button>
        </div>
    );
};

const AlunoCard = ({ aluno, type, turmasMap, onAdd, onEdit, onDelete, onSchedule, onRemove, disabledAdd }) => (
    <div className="aluno-card">
        <div className="card-header">
            <ProtectedStudentPhoto aluno={aluno} fallback={placeholderAvatar} alt={aluno.nome} className="card-photo" />
            <div className="card-info">
                <h5 className="card-name">{aluno.nome}</h5>
                {/* RM removido da visualização conforme solicitado */}
                <span className="card-details">{turmasMap[aluno.turmas_id] || 'Sem Turma'}</span>
            </div>
        </div>
        {aluno.descricao && type === 'associado' && (
            <div className="card-body">
                <p className="card-description-text">{aluno.descricao}</p>
            </div>
        )}
        <div className="card-actions" data-button-count={type === 'geral' ? 3 : 2}>
            {type === 'geral' ? (
                <>
                    <button title="Adicionar à necessidade" className="action-button-card add" onClick={onAdd} disabled={disabledAdd}><i className="bi bi-plus-lg"></i></button>
                    <button title="Editar Aluno" className="action-button-card edit" onClick={onEdit}><i className="bi bi-pencil-fill"></i></button>
                    <button title="Deletar Aluno" className="action-button-card delete" onClick={onDelete}><i className="bi bi-trash-fill"></i></button>
                </>
            ) : (
                <>
                    <button className="action-button-card schedule" onClick={onSchedule} title="Agendar Dia"><i className="bi bi-calendar-week"></i></button>
                    <button className="action-button-card remove" onClick={onRemove} title="Remover da Categoria"><i className="bi bi-trash-fill"></i></button>
                </>
            )}
        </div>
    </div>
);

export const buildPlanningPdf = ({ completeData, scheduleDays, classNames }) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Relatório de Contagens - Menu Solutions", 14, 20);
    doc.setFontSize(10); doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 28);

    const rows = [];
    completeData.forEach(nec => {
        nec.alunos.forEach(al => {
            const relacaoId = al.alunos_has_necessidades_id;
            const dias = scheduleDays.filter(d => d.alunos.some(a => String(a.relacao_id) === String(relacaoId))).map(d => d.dia).join(', ');
            rows.push([al.nome, classNames[al.turmas_id] || 'N/A', nec.necessidade, dias || 'Sempre']);
        });
    });

    autoTable(doc, {
        startY: 35,
        head: [['Aluno', 'Turma', 'Categoria', 'Dias Agendados']],
        body: rows,
        theme: 'striped'
    });
    return doc;
};

// --- COMPONENTE PRINCIPAL ---

const PlanejamentoPage = () => {
    const [necessidades, setNecessidades] = useState([]);
    const [todosAlunos, setTodosAlunos] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [dadosCompletos, setDadosCompletos] = useState([]);
    const [diasDaSemana, setDiasDaSemana] = useState([]);
    const [selectedNecessidadeId, setSelectedNecessidadeId] = useState(null);
    const [searchTermCentral, setSearchTermCentral] = useState('');
    const [searchTermAlunosPanel, setSearchTermAlunosPanel] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    const turmasMap = useMemo(() => turmas.reduce((map, turma) => {
        map[turma.id] = turma.nome_turma;
        return map;
    }, {}), [turmas]);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [necessidadesData, alunosData, turmasData, cronogramaData] = await Promise.all([
                getTodasNecessidades(), getTodosAlunos(), getTodasTurmas(), getTodosCronograma()
            ]);
            
            setNecessidades(necessidadesData || []);
            setTodosAlunos(alunosData || []);
            setTurmas(turmasData || []);
            setDiasDaSemana(cronogramaData || []);

            if (necessidadesData?.length > 0) {
                const resultados = await Promise.all(necessidadesData.map(nec => getNecessidadeComAlunos(nec.id)));
                setDadosCompletos(resultados.filter(Boolean));
            }
        } catch (error) {
            console.error(error);
        } finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSelectNecessidade = (id) => {
        setSelectedNecessidadeId(id);
        setSearchTermCentral('');
    };
    
    const displayedAlunosCentral = useMemo(() => {
        if (!selectedNecessidadeId) return [];
        const necSel = dadosCompletos.find(nec => nec.id === selectedNecessidadeId);
        const alunosToShow = (necSel?.alunos || []).map(alunoRelacionado => {
            const alunoBase = todosAlunos.find(aluno => aluno.id === alunoRelacionado.id);
            return alunoBase
                ? { ...alunoBase, ...alunoRelacionado }
                : alunoRelacionado;
        }).filter(aluno => aluno?.alunos_has_necessidades_id);
        
        if (searchTermCentral) {
            return alunosToShow.filter(aluno => aluno.nome.toLowerCase().includes(searchTermCentral.toLowerCase()));
        }
        return alunosToShow;
    }, [selectedNecessidadeId, todosAlunos, dadosCompletos, searchTermCentral]);
    
    const filteredAlunosPanel = useMemo(() => 
        todosAlunos.filter(a => a.nome.toLowerCase().includes(searchTermAlunosPanel.toLowerCase()))
    , [todosAlunos, searchTermAlunosPanel]);

    // --- CRUD NECESSIDADES ---

    const handleAddNecessidade = async () => {
        const { value: nome } = await Swal.fire({ title: 'Criar Categoria', input: 'text', inputPlaceholder: 'Ex: Sem Glúten', showCancelButton: true, confirmButtonText: 'Criar', confirmButtonColor: '#28a745' });
        if (nome) {
            try {
                await addNecessidade(nome);
                fetchData();
            } catch (e) { Swal.fire('Erro', 'Falha ao criar.', 'error'); }
        }
    };

    const handleEditNecessidade = async (nec) => {
        const { value: nome } = await Swal.fire({
            title: 'Editar Categoria',
            input: 'text',
            inputValue: nec.necessidade,
            inputPlaceholder: 'Ex: Sem Glúten',
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar'
        });
        if (nome && nome.trim() !== '') {
            try {
                await updateNecessidade(nec.id, nome.trim());
                fetchData();
            } catch (e) { Swal.fire('Erro', 'Falha ao atualizar.', 'error'); }
        }
    };

    const handleDeleteNecessidade = async (nec) => {
        const result = await Swal.fire({
            titleText: `Excluir "${nec.necessidade}"?`,
            text: 'Isso só será permitido se não houver alunos vinculados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            confirmButtonColor: '#dc3545',
            cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            try {
                await deleteNecessidade(nec.id);
                if (selectedNecessidadeId === nec.id) setSelectedNecessidadeId(null);
                fetchData();
            } catch (e) { Swal.fire('Erro', 'Remova as relações dos alunos antes de excluir.', 'error'); }
        }
    };

    // --- CRUD ALUNOS (RM E DATA AUTOMÁTICOS) ---

    const handleOpenAlunoModal = (aluno = null) => {
        const isEditing = !!aluno;
        const form = createDomElement('div', { className: 'swal-form-container' });
        const generoSelect = createSelect('swal-genero', [
            { value: '', label: 'Selecione o Gênero' },
            { value: 'Masculino', label: 'Masculino' },
            { value: 'Feminino', label: 'Feminino' },
        ], aluno?.genero || '');
        const turmaSelect = createSelect('swal-turma', [
            { value: '', label: 'Selecione a Turma' },
            ...turmas.map(t => ({ value: t.id, label: t.nome_turma })),
        ], aluno?.turmas_id || '');
        const fotoContainer = createDomElement('div', {
            style: { marginTop: '15px', textAlign: 'left', padding: '0 20px' },
        }, [
            createDomElement('label', {
                textContent: 'Foto do Aluno (Opcional)',
                style: { fontWeight: '600', color: '#555', fontSize: '14px' },
            }),
            createDomElement('input', {
                id: 'swal-foto',
                type: 'file',
                className: 'swal2-file',
                style: { marginTop: '5px' },
                accept: 'image/*',
            }),
        ]);
        form.append(
            createDomElement('input', {
                id: 'swal-nome',
                className: 'swal2-input',
                placeholder: 'Nome do Aluno',
                value: aluno?.nome || '',
            }),
            generoSelect,
            turmaSelect,
            fotoContainer,
            createDomElement('textarea', {
                id: 'swal-descricao',
                className: 'swal2-textarea',
                placeholder: 'Observações/Restrições...',
                value: aluno?.descricao || '',
            }),
        );

        Swal.fire({
            title: isEditing ? 'Editar Aluno' : 'Adicionar Aluno',
            width: '550px',
            html: form,
            focusConfirm: false, 
            showCancelButton: true, 
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            preConfirm: async () => {
                const nome = document.getElementById('swal-nome').value;
                if (!nome) return Swal.showValidationMessage('O nome é obrigatório!');

                // --- Lógica Automática solicitada ---
                const rmAuto = isEditing ? aluno.rm : `AUTO-${Date.now()}`;
                const dataNascAuto = "0001-01-01";

                const data = {
                    nome,
                    rm: rmAuto,
                    data_nascimento: dataNascAuto,
                    genero: document.getElementById('swal-genero').value,
                    turmas_id: document.getElementById('swal-turma').value,
                    descricao: document.getElementById('swal-descricao').value,
                };

                const fotoFile = document.getElementById('swal-foto').files[0];
                data.fotoFile = fotoFile || null;
                return data;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const { fotoFile, ...alunoData } = result.value || {};
                    const saved = isEditing ? await updateAluno(aluno.id, alunoData) : await addAluno(alunoData);
                    const savedAluno = saved?.data || saved;
                    if (fotoFile && savedAluno?.id) await uploadAlunoFoto(savedAluno.id, fotoFile);
                    Swal.fire({ icon: 'success', title: 'Salvo!', timer: 1500, showConfirmButton: false });
                    fetchData();
                } catch (e) { Swal.fire('Erro', 'Não foi possível salvar.', 'error'); }
            }
        });
    };

    // --- RESTANTE DAS FUNÇÕES (ASSOCIAR, AGENDAR, PDF) ---

    const handleAddAlunoToNecessidade = async (alunoId) => {
        if (!selectedNecessidadeId) return Swal.fire('Aviso', 'Selecione uma categoria primeiro!', 'info');
        try {
            await associarNecessidadesAoAluno(alunoId, [selectedNecessidadeId]);
            fetchData();
        } catch (e) { Swal.fire('Erro', 'Falha ao associar.', 'error'); }
    };

    const handleRemoveAlunoFromNecessidade = async (aluno) => {
        const res = await Swal.fire({ title: 'Remover?', text: `Remover ${aluno.nome} desta categoria?`, icon: 'warning', showCancelButton: true });
        if (res.isConfirmed) {
            try {
                await desassociarAlunoDaNecessidade(selectedNecessidadeId, aluno.id);
                fetchData();
            } catch (e) { Swal.fire('Erro', 'Falha ao remover.', 'error'); }
        }
    };

    const handleDeleteAluno = async (id) => {
        const res = await Swal.fire({ title: 'Excluir?', text: 'Isso apagará o aluno permanentemente.', icon: 'error', showCancelButton: true });
        if (res.isConfirmed) {
            try {
                await deleteAluno(id);
                fetchData();
            } catch (e) { Swal.fire('Erro', 'Falha ao excluir.', 'error'); }
        }
    };

    const handleOpenScheduleModal = async (aluno) => {
        const relacao = dadosCompletos.find(n => n.id === selectedNecessidadeId)?.alunos?.find(a => a.id === aluno.id);
        const relacaoId = relacao?.alunos_has_necessidades_id;
        if(!relacaoId) {
            console.error('Não foi possível agendar: relação aluno+necessidade ausente.', aluno);
            return;
        }
        
        const diasAgendados = [];
        diasDaSemana.forEach(d => {
            if(d.alunos.some(ag => String(ag.relacao_id) === String(relacaoId))) {
                diasAgendados.push(String(d.id));
            }
        });

        const { value: selectedIds } = await Swal.fire({
            titleText: `Dias para ${aluno.nome}`,
            html: createDomElement('div', { className: 'swal-checkbox-container' }, diasDaSemana.map(d => createDomElement('label', { className: 'swal-checkbox-label' }, [
                createDomElement('input', {
                    type: 'checkbox',
                    className: 'swal-dia-checkbox',
                    value: d.id,
                    checked: diasAgendados.includes(String(d.id)),
                }),
                document.createTextNode(` ${d.dia}`),
            ]))),
            showCancelButton: true,
            preConfirm: () => Array.from(document.querySelectorAll('.swal-dia-checkbox:checked')).map(cb => cb.value)
        });

        if (selectedIds) {
            try {
                const toAdd = selectedIds.filter(id => !diasAgendados.includes(id));
                const toRem = diasAgendados.filter(id => !selectedIds.includes(id));
                if(toAdd.length) await agendarRelacaoNosDias(relacaoId, toAdd);
                if(toRem.length) await Promise.all(toRem.map(id => removerAgendamentoDoDia(relacaoId, id)));
                fetchData();
            } catch (e) { Swal.fire('Erro', 'Erro ao agendar.', 'error'); }
        }
    };

    const handleDownloadPdf = () => {
        const doc = buildPlanningPdf({
            completeData: dadosCompletos,
            scheduleDays: diasDaSemana,
            classNames: turmasMap,
        });
        doc.save('relatorio_planejamento.pdf');
    };

    return (
        <section className="planejamento-container-grid">
            <div className="panel-lateral panel-necessidades">
                <div className="panel-header">
                    <h3>Categorias</h3>
                    <button className="add-button-small" onClick={handleAddNecessidade}>+</button>
                </div>
                <div className="list-container">
                    {necessidades.map(nec => (
                        <div key={nec.id} className={`list-item-container ${selectedNecessidadeId === nec.id ? 'active' : ''}`} onClick={() => handleSelectNecessidade(nec.id)}>
                            <span className="list-item-name">{nec.necessidade}</span>
                            <div className="list-item-actions">
                                <button title="Editar Categoria" onClick={(e) => { e.stopPropagation(); handleEditNecessidade(nec); }}><i className="bi bi-pencil-fill"></i></button>
                                <button title="Excluir Categoria" onClick={(e) => { e.stopPropagation(); handleDeleteNecessidade(nec); }}><i className="bi bi-trash-fill"></i></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="panel-central">
                <div className="panel-header">
                    <h3>{selectedNecessidadeId ? `Alunos em ${necessidades.find(n => n.id === selectedNecessidadeId)?.necessidade}` : 'Selecione uma Categoria'}</h3>
                    <div className="header-actions">
                        <SearchBar searchTerm={searchTermCentral} setSearchTerm={setSearchTermCentral} placeholder="Buscar..." />
                        <button className="action-button-pdf" onClick={handleDownloadPdf}><i className="bi bi-file-pdf"></i> PDF</button>
                    </div>
                </div>
                <div className="grid-container-central">
                    {displayedAlunosCentral.map(aluno => (
                        <AlunoCard key={aluno.id} aluno={aluno} type="associado" turmasMap={turmasMap} onSchedule={() => handleOpenScheduleModal(aluno)} onRemove={() => handleRemoveAlunoFromNecessidade(aluno)} />
                    ))}
                </div>
            </div>

            <div className="panel-lateral panel-alunos">
                <div className="panel-header">
                    <h3>Base de Alunos</h3>
                    <button className="add-button-small" onClick={() => handleOpenAlunoModal()}>+</button>
                </div>
                <div style={{padding: '0 15px 10px'}}><SearchBar searchTerm={searchTermAlunosPanel} setSearchTerm={setSearchTermAlunosPanel} placeholder="Filtrar base..." /></div>
                <div className="list-container-cards">
                    {filteredAlunosPanel.map(aluno => (
                        <AlunoCard key={aluno.id} aluno={aluno} type="geral" turmasMap={turmasMap} onAdd={() => handleAddAlunoToNecessidade(aluno.id)} onEdit={() => handleOpenAlunoModal(aluno)} onDelete={() => handleDeleteAluno(aluno.id)} disabledAdd={!selectedNecessidadeId} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PlanejamentoPage;
