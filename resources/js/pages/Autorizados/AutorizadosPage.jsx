import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { 
    getTodosAutorizados,
    addAutorizado, 
    updateAutorizado, 
    updateConteudoAutorizado, 
    deleteAutorizado 
} from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { createDomElement } from '../../utils/safeDom';
import './AutorizadosPage.css';

const AutorizadosPage = () => {
    const { isNutri, isDiretor } = usePermissions();
    const [autorizados, setAutorizados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getTodosAutorizados();
            const sortedData = data.sort((a, b) => {
                if (a.status === 'pendente' && b.status !== 'pendente') return -1;
                if (a.status !== 'pendente' && b.status === 'pendente') return 1;
                return new Date(b.created_at) - new Date(a.created_at);
            });
            setAutorizados(sortedData);
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar os registros.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return autorizados;
        const term = searchTerm.toLowerCase();
        return autorizados.filter(item => 
            item.titulo?.toLowerCase().includes(term) ||
            item.conteudo?.toLowerCase().includes(term)
        );
    }, [autorizados, searchTerm]);

    const handleOpenModal = (item = null) => {
        const isEditing = !!item;
        const form = createDomElement('div', { style: { textAlign: 'left' } });
        const titleLabel = createDomElement('label', {
            textContent: 'Título / Assunto',
            style: { fontWeight: '600', fontSize: '0.9rem', color: '#555' },
        });
        const titleInput = createDomElement('input', {
            id: 'swal-titulo',
            className: 'swal2-input',
            placeholder: 'Ex: Autorização para aluno sair cedo',
            value: item?.titulo || '',
            style: 'margin: 5px 0 15px 0; width: 100%',
        });
        const contentLabel = createDomElement('label', {
            textContent: 'Detalhes',
            style: { fontWeight: '600', fontSize: '0.9rem', color: '#555' },
        });
        const contentInput = createDomElement('textarea', {
            id: 'swal-conteudo',
            className: 'swal2-textarea',
            placeholder: 'Descreva os detalhes...',
            value: item?.conteudo || '',
            style: 'margin: 5px 0; width: 100%',
        });
        form.append(titleLabel, titleInput, contentLabel, contentInput);

        Swal.fire({
            title: isEditing ? 'Editar Solicitação' : 'Nova Solicitação',
            html: form,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#a72828ff',
            width: 600,
            preConfirm: () => {
                const titulo = document.getElementById('swal-titulo').value;
                const conteudo = document.getElementById('swal-conteudo').value;
                if (!titulo || !conteudo) {
                    Swal.showValidationMessage('Título e Conteúdo são obrigatórios');
                    return false;
                }
                return { titulo, conteudo };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    if (isEditing) {
                        await updateAutorizado(item.id, result.value);
                    } else {
                        await addAutorizado(result.value);
                    }
                    
                    Swal.fire({ icon: 'success', title: 'Salvo!', timer: 1500, showConfirmButton: false });
                    fetchData();
                } catch (error) {
                    Swal.fire('Erro', error.message || 'Falha ao salvar.', 'error');
                }
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Excluir?',
            text: "Essa ação é irreversível.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sim, excluir'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteAutorizado(id);
                    Swal.fire({ icon: 'success', title: 'Excluído', timer: 1500, showConfirmButton: false });
                    fetchData();
                } catch (error) {
                    Swal.fire('Erro', 'Não foi possível excluir.', 'error');
                }
            }
        });
    };

    const handleDecision = (item, status) => {
        const isRefusal = status === 'recusado';
        Swal.fire({
            title: isRefusal ? 'Recusar Autorização?' : 'Confirmar Autorização?',
            text: `Deseja mudar o status de "${item.titulo}" para ${isRefusal ? 'Recusado' : 'Confirmado'}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: isRefusal ? '#dc3545' : '#27ae60',
            confirmButtonText: isRefusal ? 'Sim, Recusar' : 'Sim, Confirmar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await updateConteudoAutorizado(item.id, { status });
                    Swal.fire({ icon: 'success', title: isRefusal ? 'Recusado!' : 'Autorizado!', timer: 1500, showConfirmButton: false });
                    fetchData();
                } catch (error) {
                    Swal.fire('Erro', isRefusal ? 'Falha ao recusar.' : 'Falha ao aprovar.', 'error');
                }
            }
        });
    };

    const handleApprove = (item) => handleDecision(item, 'confirmado');
    const handleRefuse = (item) => handleDecision(item, 'recusado');

    // --- CONFIGURAÇÃO DE PERMISSÕES ---
    const canCreate = isNutri;
    const canApprove = isDiretor;
    const canEdit = isNutri;
    const canDelete = isNutri; 

    return (
        <section className="autorizados-container">
            <div className="autorizados-content">
                <div className="autorizados-header">
                    <h2>
                        <i className="bi bi-file-earmark-check-fill autorizados-header-icon" aria-hidden="true"></i> 
                        Autorizados Pela Direção
                    </h2>
                    <div className="header-tools">
                        <div className="search-container">
                            <i className="bi bi-search search-icon"></i>
                            <input 
                                type="text" 
                                className="search-input" 
                                placeholder="Buscar por título..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        {canCreate && (
                            <button className="btn-create" onClick={() => handleOpenModal(null)}>
                                <i className="bi bi-plus-lg"></i> Nova Solicitação
                            </button>
                        )}
                    </div>
                </div>

                <div className="autorizados-grid-scroll">
                    {loading ? (
                        <div className="autorizados-loading-container">
                            <div className="spinner-border text-secondary" role="status"></div>
                        </div>
                    ) : filteredData.length > 0 ? (
                        filteredData.map(item => (
                            <div key={item.id} className={`auth-card ${item.status}`}>
                                <div className="auth-card-body">
                                    <div className="auth-date">
                                        {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                                    </div>
                                    <h3 className="auth-title">{item.titulo}</h3>
                                    <p className="auth-text">{item.conteudo}</p>
                                </div>
                                
                                <div className="auth-card-footer">
                                    <span className={`status-pill ${item.status}`}>
                                        {item.status === 'confirmado' ? <><i className="bi bi-check-circle"></i> Confirmado</> : item.status === 'recusado' ? <><i className="bi bi-x-circle"></i> Recusado</> : <><i className="bi bi-clock"></i> Pendente</>}
                                    </span>

                                    <div className="auth-actions">
                                        {canApprove && item.status === 'pendente' && (
                                            <>
                                            <button className="btn-icon-auth btn-approve-auth" onClick={() => handleApprove(item)} title="Aprovar">
                                                <i className="bi bi-check-lg"></i> Aprovar
                                            </button>
                                            <button className="btn-icon-auth btn-delete-auth" onClick={() => handleRefuse(item)} title="Recusar">
                                                <i className="bi bi-x-lg"></i> Recusar
                                            </button>
                                            </>
                                        )}

                                        {canEdit && item.status === 'pendente' && (
                                            <button className="btn-icon-auth btn-edit-auth" onClick={() => handleOpenModal(item)} title="Editar">
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                        )}

                                        {canDelete && (
                                            <button className="btn-icon-auth btn-delete-auth" onClick={() => handleDelete(item.id)} title="Excluir">
                                                <i className="bi bi-trash-fill"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <i className="bi bi-inbox"></i>
                            <p>Nenhuma solicitação encontrada.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default AutorizadosPage;
