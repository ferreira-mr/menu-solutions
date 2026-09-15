import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import {
    getContagensDashboard,
    getTodosAlunosContagemNes,
    getTodasNecessidades,
    getNecessidadeComAlunos,
    getTodasTurmas
} from '../../services/api'; 
import { createDomElement } from '../../utils/safeDom';
import { useSchoolCalendar } from '../../features/contagem/useSchoolCalendar';
import { getSchoolDateFromInstant } from '../../features/contagem/schoolCalendar';
import { normalizeCountTotals, summarizeDashboardTotals } from '../../features/contagem/countTotals';
import './DashboardNutri.css';

// Componente de Card Reutilizável
const DashboardCard = ({ title, count, icon, onClick, className = '' }) => (
    <div className={`dash-card ${className} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
        <div className="dash-card-header">
            <i className={`bi ${icon}`}></i>
            <span>{title}</span>
        </div>
        <div className="dash-card-body">
            {count}
        </div>
    </div>
);

// Componente de Seletor (Toggle Switch)
const ModeToggle = ({ mode, onToggle }) => (
    <div className="mode-toggle">
        <button
            className={`toggle-btn ${mode === 'contagens' ? 'active' : ''}`}
            onClick={() => onToggle('contagens')}
        >
            <i className="bi bi-list-ol"></i> Contagens
        </button>
        <button
            className={`toggle-btn ${mode === 'necessidades' ? 'active' : ''}`}
            onClick={() => onToggle('necessidades')}
        >
            <i className="bi bi-person-fill-exclamation"></i> Necessidades
        </button>
    </div>
);

const DashboardNutri = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('contagens');
    const [loading, setLoading] = useState(true);
    
    const [dashboardData, setDashboardData] = useState([]);
    const [dashboardTotals, setDashboardTotals] = useState({
        total_regular: 0,
        total_outros: 0,
        total_combinado: 0,
    });
    const [nesData, setNesData] = useState([]);
    
    const [relacaoToTurmaMap, setRelacaoToTurmaMap] = useState(new Map());
    const [turmaInfoMap, setTurmaInfoMap] = useState(new Map());

    // Define a data de hoje formatada (YYYY-MM-DD)
    const { schoolDay: hoje, timezone } = useSchoolCalendar();

    const carregarDadosDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, nesRes, turmasRes, necessidadesRes] = await Promise.all([
                getContagensDashboard(hoje),
                getTodosAlunosContagemNes(hoje),
                getTodasTurmas(),
                getTodasNecessidades()
            ]);

            const dashboardItems = Array.isArray(dashRes?.data) ? dashRes.data : [];
            setDashboardData(dashboardItems);
            setDashboardTotals(normalizeCountTotals(dashRes?.totals, summarizeDashboardTotals(dashboardItems)));
            setNesData(nesRes || []);

            const tMap = new Map();
            (turmasRes || []).forEach(turma => {
                tMap.set(turma.id, turma.nome_turma);
            });
            setTurmaInfoMap(tMap);

            const necComAlunosRes = await Promise.all(
                (necessidadesRes || []).map(n => getNecessidadeComAlunos(n.id))
            );

            const rMap = new Map();
            necComAlunosRes.forEach(nec => {
                (nec.alunos || []).forEach(aluno => {
                    const relId = aluno.alunos_has_necessidades_id;
                    if (relId && aluno.turmas_id) {
                        rMap.set(String(relId), aluno.turmas_id);
                    }
                });
            });
            setRelacaoToTurmaMap(rMap);

        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
            Swal.fire('Erro!', 'Não foi possível carregar os dados.', 'error');
        } finally {
            setLoading(false);
        }
    }, [hoje]);

    useEffect(() => {
        carregarDadosDashboard();
    }, [carregarDadosDashboard]);

    // --- FILTROS PARA "APENAS HOJE" ---

    // Filtra as contagens das turmas para somar apenas as de hoje
    // Filtra alunos com necessidades especiais registrados hoje
    const nesHojeFiltrado = useMemo(() => {
        return (nesData || []).filter(item => {
            const dataRegistro = item.data_hora_contagem || (item.contagem && item.contagem.data_contagem);
            return getSchoolDateFromInstant(dataRegistro, timezone) === hoje;
        });
    }, [nesData, hoje, timezone]);

    const naiData = useMemo(() => {
        return nesHojeFiltrado
            .filter(item => ['NAI', 'NAE'].includes(item.aluno?.necessidade?.toUpperCase()))
            .map(item => item.aluno);
    }, [nesHojeFiltrado]);

    const necessidadesCards = useMemo(() => {
        const necMap = new Map();
        nesHojeFiltrado.forEach(item => {
            const necNome = item.aluno?.necessidade || 'Desconhecida';
            if (!necMap.has(necNome)) {
                necMap.set(necNome, []);
            }
            necMap.get(necNome).push({ ...item.aluno, relacao_id: item.relacao_id });
        });
        return necMap;
    }, [nesHojeFiltrado]);

    // --- HANDLERS DE MODAL ---

    const handleCategoriaClick = (categoria) => {
        const turmasHoje = (categoria.turmas || []).filter(t => t.data_contagem === hoje);
        const content = createDomElement('div', { className: 'modal-list scrollable' });

        if (turmasHoje.length === 0) {
            content.append(createDomElement('p', { textContent: 'Nenhuma contagem realizada hoje para esta categoria.' }));
        } else {
            turmasHoje.forEach(turma => {
                content.append(createDomElement('div', { className: 'modal-list-item' }, [
                    createDomElement('span', { textContent: turma.nome_turma }),
                    createDomElement('strong', { textContent: turma.qtd_contagem }),
                ]));
            });
        }

        Swal.fire({
            titleText: `Turmas - ${categoria.nome_categoria}`,
            html: content,
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#dc3545',
        });
    };

    const handleNaiClick = () => {
        const content = createDomElement('div', { className: 'modal-list scrollable' });

        if (naiData.length === 0) {
            content.append(createDomElement('p', { textContent: 'Nenhum aluno NAE contado hoje.' }));
        } else {
            naiData.forEach(aluno => {
                content.append(createDomElement('div', { className: 'modal-list-item simple' }, [
                    createDomElement('span', { textContent: aluno.nome }),
                ]));
            });
        }

        Swal.fire({
            title: 'Alunos - NAE Hoje',
            html: content,
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#dc3545',
        });
    };

    const handleNecessidadeClick = (necNome) => {
        const alunos = necessidadesCards.get(necNome) || [];
        const turmasMap = new Map();

        alunos.forEach(aluno => {
            if (!aluno.relacao_id) return;
            const relId = String(aluno.relacao_id);
            const turmaId = relacaoToTurmaMap.get(relId);
            const turmaNome = turmaInfoMap.get(turmaId) || 'Turma não identificada';

            if (!turmasMap.has(turmaNome)) {
                turmasMap.set(turmaNome, []);
            }
            turmasMap.get(turmaNome).push(aluno);
        });
        
        const content = createDomElement('div', { className: 'modal-list scrollable' });
        turmasMap.forEach((alunosDaTurma, turmaNome) => {
            content.append(createDomElement('h4', { className: 'modal-turma-header', textContent: turmaNome }));
            alunosDaTurma.forEach(aluno => {
                content.append(createDomElement('div', { className: 'modal-list-item simple' }, [
                    createDomElement('span', { textContent: `${aluno.nome} (RM: ${aluno.rm || 'N/A'})` }),
                ]));
            });
        });

        if (content.childElementCount === 0) {
            content.append(createDomElement('p', { textContent: 'Nenhum aluno encontrado hoje.' }));
        }

        Swal.fire({
            titleText: `${necNome} - Hoje`,
            html: content,
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#dc3545',
        });
    };

    // --- RENDERIZAÇÃO ---

    const renderContagens = () => (
        <>
            {(dashboardData || []).map(cat => {
                const totalCategoria = (cat.turmas || [])
                    .filter(t => t.data_contagem === hoje)
                    .reduce((sum, t) => sum + Number(t.qtd_contagem || 0), 0);
                
                return (
                    <DashboardCard
                        key={cat.id}
                        title={cat.nome_categoria}
                        count={totalCategoria}
                        icon="bi-building"
                        onClick={() => handleCategoriaClick(cat)}
                    />
                );
            })}
            
            <DashboardCard
                title="NAE"
                count={naiData.length}
                icon="bi-person-arms-up"
                className="nai-card"
                onClick={handleNaiClick}
            />

            <DashboardCard
                title="Total Regular"
                count={dashboardTotals.total_regular}
                icon="bi-people-fill"
                className="total-card"
                onClick={null}
            />

            <DashboardCard
                title="Total Outros"
                count={dashboardTotals.total_outros}
                icon="bi-people"
                className="total-card"
                onClick={null}
            />

            <DashboardCard
                title={<><span>Total Geral</span> <small>(Combinado)</small></>}
                count={dashboardTotals.total_combinado}
                icon="bi-bar-chart-fill"
                className="total-card"
                onClick={null}
            />
        </>
    );

    const renderNecessidades = () => (
        <>
            {[...necessidadesCards.keys()].map(necNome => (
                <DashboardCard
                    key={necNome}
                    title={necNome}
                    count={necessidadesCards.get(necNome).length}
                    icon="bi-person-fill-exclamation"
                    onClick={() => handleNecessidadeClick(necNome)}
                />
            ))}
        </>
    );

    return (
        <section className="dashboard-nutri-container">
            <ModeToggle mode={mode} onToggle={setMode} />
            
            <div className="dash-grid-container">
                <div className="dash-grid">
                    {loading ? (
                        <div className="carregando-dash">
                            <div className="spinner"></div>
                            <p>Carregando dados de hoje...</p>
                        </div>
                    ) : (
                        mode === 'contagens' ? renderContagens() : renderNecessidades()
                    )}
                </div>
            </div>

            <button className="dash-avancar-btn" onClick={() => navigate('/nutri/inicio')}>
                Acessar Menu de Ações
            </button>
        </section>
    );
};

export default DashboardNutri;
