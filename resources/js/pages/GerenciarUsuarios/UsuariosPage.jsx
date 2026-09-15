import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import { getUsers, addUser, updateUser, deleteUser } from '../../services/api';
import { createDomElement, createSelect, safePaginatorLabel } from '../../utils/safeDom';
import './UsuariosPage.css';

const UsuariosPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // Carregar dados do Backend
    const fetchUsers = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const response = await getUsers(page);
            const lista = response.data?.data || response.data || [];
            const meta = response.data?.meta || (response.data?.last_page ? response.data : null);
            
            setUsers(lista);
            setPagination(meta);
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar os usuários', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Helper para exibir o nível com estilo
    const getNivelLabel = (nivel) => {
        switch(parseInt(nivel)) {
            case 1: return { text: 'Inspetora', class: 'nivel-1' };
            case 2: return { text: 'Nutricionista', class: 'nivel-2' };
            case 3: return { text: 'Diretora', class: 'nivel-3' };
            default: return { text: 'Outro', class: 'nivel-1' };
        }
    };

    // --- CRIAR / EDITAR USUÁRIO ---
    const handleOpenUserModal = (user = null) => {
        const isEditing = !!user;
        const form = createDomElement('div', { style: { textAlign: 'left' } });
        const nameInput = createDomElement('input', {
            id: 'swal-name',
            className: 'swal2-input',
            placeholder: 'Ex: Maria Silva',
            value: user?.name || '',
            style: 'margin: 0 0 15px 0; width: 100%',
        });
        const nifInput = createDomElement('input', {
            id: 'swal-nif',
            className: 'swal2-input',
            placeholder: 'Ex: 123456',
            value: user?.nif || '',
            style: 'margin: 0 0 15px 0; width: 100%',
        });
        const levelSelect = createSelect('swal-level', [
            { value: '1', label: 'Inspetora / Apoio' },
            { value: '2', label: 'Nutricionista' },
            { value: '3', label: 'Diretora (Admin)' },
        ], user?.nivel_user || '1');
        levelSelect.className = 'swal2-select';
        levelSelect.style.cssText = 'margin: 0 0 15px 0; width: 100%; display:block';
        const passwordInput = createDomElement('input', {
            id: 'swal-password',
            type: 'password',
            className: 'swal2-input',
            placeholder: isEditing ? 'Deixe em branco para manter' : 'Mínimo 8 caracteres',
            style: 'margin: 0; width: 100%',
        });
        const label = text => createDomElement('label', {
            textContent: text,
            style: { display: 'block', marginBottom: '5px', fontWeight: '600' },
        });

        form.append(
            label('Nome Completo'), nameInput,
            label('NIF (Login)'), nifInput,
            label('Nível de Acesso'), levelSelect,
            label(isEditing ? 'Nova Senha (Opcional)' : 'Senha Inicial'), passwordInput,
        );

        Swal.fire({
            titleText: isEditing ? 'Editar Usuário' : 'Novo Usuário',
            html: form,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#dc3545',
            focusConfirm: false,
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const nif = document.getElementById('swal-nif').value;
                const nivel_user = document.getElementById('swal-level').value;
                const password = document.getElementById('swal-password').value;

                // Validação de campos visíveis
                if (!name || !nif) {
                    Swal.showValidationMessage('Nome e NIF são obrigatórios');
                    return false;
                }
                
                if (!isEditing && (!password || password.length < 8)) {
                    Swal.showValidationMessage('A senha inicial deve ter pelo menos 8 caracteres');
                    return false;
                }

                // Montagem dos dados: E-mail único derivado do NIF
                const cleanNif = nif.replace(/\D/g, '') || nif;
                const data = { 
                    name, 
                    nif, 
                    nivel_user: Number(nivel_user),
                    email: user?.email || `${cleanNif}@menusolutions.local`
                };

                if (password) {
                    data.password = password;
                    data.password_confirmation = password; 
                }
                return data;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    if (isEditing) {
                        await updateUser(user.id, result.value);
                        Swal.fire({ icon: 'success', title: 'Atualizado!', timer: 1500, showConfirmButton: false });
                    } else {
                        await addUser(result.value);
                        Swal.fire({ icon: 'success', title: 'Criado!', timer: 1500, showConfirmButton: false });
                    }
                    fetchUsers();
                } catch (error) {
                    Swal.fire('Erro', 'Verifique se o NIF já existe no sistema.', 'error');
                }
            }
        });
    };

    // --- RESETAR SENHA ---
    const handleResetPassword = (user) => {
        Swal.fire({
            titleText: `Nova senha para ${user.name}`,
            input: 'password',
            inputPlaceholder: 'Digite a nova senha (mínimo 8 caracteres)',
            showCancelButton: true,
            confirmButtonText: 'Alterar',
            confirmButtonColor: '#fd7e14',
            preConfirm: (newPass) => {
                if (!newPass || newPass.length < 8) {
                    Swal.showValidationMessage('A nova senha deve ter pelo menos 8 caracteres');
                    return false;
                }
                return newPass;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await updateUser(user.id, { 
                        password: result.value,
                        password_confirmation: result.value,
                        email: user.email || `${user.nif}@menusolutions.local`
                    });
                    Swal.fire({ icon: 'success', title: 'Senha alterada!', timer: 1500, showConfirmButton: false });
                } catch (error) {
                    Swal.fire('Erro', 'Falha ao alterar senha.', 'error');
                }
            }
        });
    };

    // --- EXCLUIR ---
    const handleDelete = (user) => {
        Swal.fire({
            title: 'Excluir usuário?',
            text: `Tem certeza que deseja remover ${user.name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sim, excluir'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteUser(user.id);
                    Swal.fire({ icon: 'success', title: 'Excluído!', timer: 1500, showConfirmButton: false });
                    fetchUsers();
                } catch (error) {
                    Swal.fire('Erro', 'Não foi possível excluir.', 'error');
                }
            }
        });
    };

    return (
        <div className="usuarios-container">
            <div className="page-header">
                <h1><i className="bi bi-people-fill"></i> Gerenciar Usuários</h1>
                <button className="btn-add" onClick={() => handleOpenUserModal()}>
                    <i className="bi bi-person-plus-fill"></i> Novo Usuário
                </button>
            </div>

            <div className="table-responsive">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>NIF (Login)</th>
                            <th>Nível de Acesso</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" style={{textAlign:'center', padding:'3rem'}}>
                                    <div className="spinner-border text-success" role="status"></div>
                                    <p style={{marginTop:'10px'}}>Carregando usuários...</p>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{textAlign:'center', padding:'3rem', color:'#999'}}>
                                    Nenhum usuário encontrado.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => {
                                const nivel = getNivelLabel(user.nivel_user);
                                return (
                                    <tr key={user.id}>
                                        <td style={{fontWeight:'500'}}>{user.name}</td>
                                        <td>{user.nif}</td>
                                        <td>
                                            <span className={`badge-nivel ${nivel.class}`}>
                                                {nivel.text}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button className="btn-action btn-edit" title="Editar" onClick={() => handleOpenUserModal(user)}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                            <button className="btn-action btn-password" title="Resetar Senha" onClick={() => handleResetPassword(user)}>
                                                <i className="bi bi-key-fill"></i>
                                            </button>
                                            <button className="btn-action btn-delete" title="Excluir" onClick={() => handleDelete(user)}>
                                                <i className="bi bi-trash-fill"></i>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            
            {pagination && pagination.last_page > 1 && (
                <div className="pagination">
                    {pagination.links?.map((link, index) => (
                        <button
                            key={index}
                            className={`page-btn ${link.active ? 'active' : ''}`}
                            disabled={!link.url}
                            onClick={() => {
                                const page = new URL(link.url, window.location.origin).searchParams.get('page');
                                fetchUsers(page);
                            }}
                        >
                            {safePaginatorLabel(link.label)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UsuariosPage;
