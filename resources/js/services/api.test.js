import {
  addCategoria,
  updateCategoria,
  deleteCategoria,
  addCardapio,
  getCardapios,
  getLatestCardapio,
  deleteCardapio,
  getCategorias,
  getTurmas,
  addTurma,
  updateTurma,
  deleteTurma,
  getCronograma,
  agendarRelacaoNosDias,
  removerAgendamentoDoDia,
  loginUser,
  logoutUser,
  getUserData,
  updateUserData,
  changePassword,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getAutorizados,
  addAutorizado,
  updateAutorizado,
  updateConteudoAutorizado,
  deleteAutorizado,
  getProducao,
  addProducao,
  updateProducao,
  deleteProducao,
  getNecessidades,
  getNecessidadeComAlunos,
  addNecessidade,
  updateNecessidade,
  deleteNecessidade,
  getAlunos,
  addAluno,
  updateAluno,
  deleteAluno,
  associarNecessidadesAoAluno,
  desassociarAlunoDaNecessidade,
  getContagensDeHoje,
  addContagem,
  updateContagem,
  saveContagemOperation,
  getAlunosContagemNes,
  addAlunoNaContagemNes,
  removeAlunoDaContagemNes,
  getContagensDashboard,
  getContagensPorRange,
  getDashboardPorData,
  getAlunosNesPorData,
  getContextoEscolar,
  getChatMessages,
  getChatMessagesPage,
  sendMessage,
  getChatMembers,
  getChatContacts,
  uploadFile,
  uploadAlunoFoto,
  fetchProtectedAsset,
} from './api';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetchJson(body = { data: [] }, status = 200) {
  fetch.mockImplementation(() => Promise.resolve(jsonResponse(body, status)));
}

describe('cliente da API - Cobertura Completa', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'token-de-teste');
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Autenticação e Perfil', () => {
    it('loginUser envia credenciais e propaga erro', async () => {
      fetch.mockImplementationOnce(() => Promise.resolve(jsonResponse({ token: 'xyz' })));
      const res = await loginUser('11111111111', 'secret');
      expect(fetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({ method: 'POST' }));
      expect(res.token).toBe('xyz');

      fetch.mockImplementationOnce(() => Promise.resolve(jsonResponse({ message: 'Credenciais inválidas' }, 401)));
      await expect(loginUser('00000000000', 'errada')).rejects.toThrow('Credenciais inválidas');
    });

    it('logoutUser, getUserData, updateUserData e changePassword', async () => {
      mockFetchJson({ success: true });

      await logoutUser();
      expect(fetch).toHaveBeenCalledWith('/api/logout', expect.objectContaining({ method: 'POST' }));

      await getUserData();
      expect(fetch).toHaveBeenCalledWith('/api/user', expect.any(Object));

      await updateUserData(5, { name: 'Novo Nome' });
      expect(fetch).toHaveBeenCalledWith('/api/users/5', expect.objectContaining({ method: 'PUT' }));

      await changePassword({ current_password: 'old', password: 'new' });
      expect(fetch).toHaveBeenCalledWith('/api/reset-password', expect.objectContaining({ method: 'POST' }));
    });
  });

  describe('CRUD de Usuários', () => {
    it('getUsers, addUser, updateUser, deleteUser', async () => {
      mockFetchJson({ data: [] });

      await getUsers(2);
      expect(fetch).toHaveBeenCalledWith('/api/users?page=2', expect.any(Object));

      await addUser({ name: 'User' });
      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({ method: 'POST' }));

      await updateUser(10, { name: 'Editado' });
      expect(fetch).toHaveBeenCalledWith('/api/users/10', expect.objectContaining({ method: 'PUT' }));

      fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 204 })));
      await deleteUser(10);
      expect(fetch).toHaveBeenCalledWith('/api/users/10', expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Uploads e Cardápios', () => {
    it('uploadFile e addCardapio enviam FormData', async () => {
      mockFetchJson({ path: 'foto.jpg' });
      const file = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });

      await uploadFile(file, 10);
      expect(fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({ method: 'POST' }));

      await addCardapio(file);
      expect(fetch).toHaveBeenCalledWith('/api/cardapios', expect.objectContaining({ method: 'POST' }));
    });

    it('vincula upload de foto ao aluno e busca arquivo protegido com Bearer, sem query token', async () => {
      mockFetchJson({ data: { id: 10, foto_url: '/api/alunos/10/foto' } });
      const file = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });

      await uploadAlunoFoto(10, file);
      expect(fetch).toHaveBeenCalledWith('/api/alunos/10/foto', expect.objectContaining({ method: 'POST' }));

      fetch.mockImplementationOnce(() => Promise.resolve(new Response(new Blob(['img']), { status: 200 })));
      await fetchProtectedAsset('/api/alunos/10/foto');
      expect(fetch).toHaveBeenCalledWith('/api/alunos/10/foto', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-de-teste' }),
      }));
      expect(fetch.mock.calls.at(-1)[0]).not.toContain('token=');
    });

    it('getCardapios, getLatestCardapio e deleteCardapio', async () => {
      fetch.mockImplementationOnce(() => Promise.resolve(jsonResponse({ data: [{ id: 1, path: 'menu.pdf' }] })));
      const latest = await getLatestCardapio();
      expect(latest.id).toBe(1);

      fetch.mockImplementationOnce(() => Promise.resolve(jsonResponse({ data: [] })));
      const empty = await getLatestCardapio();
      expect(empty).toBeNull();

      fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 204 })));
      await deleteCardapio(1);
      expect(fetch).toHaveBeenCalledWith('/api/cardapios/1', expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Autorizados (Refeições Avulsas)', () => {
    it('getAutorizados, addAutorizado, updateAutorizado e deleteAutorizado', async () => {
      mockFetchJson({ data: [] });

      await getAutorizados();
      expect(fetch).toHaveBeenCalledWith('/api/autorizados', expect.any(Object));

      await addAutorizado({ titulo: 'Visita' });
      expect(fetch).toHaveBeenCalledWith('/api/autorizados', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ titulo: 'Visita' }),
      }));

      await updateAutorizado(3, { titulo: 'Novo' });
      expect(fetch).toHaveBeenCalledWith('/api/autorizados/3', expect.objectContaining({ method: 'PUT' }));

      await updateConteudoAutorizado(3, { status: 'confirmado' });
      expect(fetch).toHaveBeenCalledWith('/api/autorizados/update/3', expect.objectContaining({ method: 'PUT' }));

      fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 204 })));
      await deleteAutorizado(3);
      expect(fetch).toHaveBeenCalledWith('/api/autorizados/3', expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Controle de Produção e Consumo', () => {
    it('getProducao, addProducao, updateProducao, deleteProducao', async () => {
      mockFetchJson({ data: [] });

      await getProducao();
      expect(fetch).toHaveBeenCalledWith('/api/controle_de_producao', expect.any(Object));

      await addProducao({ nome_alimento: 'Arroz' });
      expect(fetch).toHaveBeenCalledWith('/api/controle_de_producao', expect.objectContaining({ method: 'POST' }));

      await updateProducao(4, { quantidade_alimento: 10 });
      expect(fetch).toHaveBeenCalledWith('/api/controle_de_producao/4', expect.objectContaining({ method: 'PUT' }));

      fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 204 })));
      await deleteProducao(4);
      expect(fetch).toHaveBeenCalledWith('/api/controle_de_producao/4', expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Cronograma e Planejamento', () => {
    it('getCronograma, agendarRelacaoNosDias e removerAgendamentoDoDia', async () => {
      mockFetchJson({ data: [] });

      await getCronograma();
      expect(fetch).toHaveBeenCalledWith('/api/cronogramas', expect.any(Object));

      await agendarRelacaoNosDias(1, [2, 3]);
      expect(fetch).toHaveBeenCalledWith('/api/alunos-necessidades/1/dias', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ dias: [2, 3] }),
      }));

      await removerAgendamentoDoDia(1, 2);
      expect(fetch).toHaveBeenCalledWith('/api/alunos-necessidades/1/dias', expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ dias: [2] }),
      }));
    });
  });

  describe('Necessidades e Alunos', () => {
    it('CRUD de necessidades e associação com alunos', async () => {
      mockFetchJson({ data: [] });

      await getNecessidades(1, 50);
      expect(fetch).toHaveBeenCalledWith('/api/necessidades?page=1&limit=50', expect.any(Object));

      await getNecessidadeComAlunos(3);
      expect(fetch).toHaveBeenCalledWith('/api/necessidades/3', expect.any(Object));

      await addNecessidade('Diabetes');
      expect(fetch).toHaveBeenCalledWith('/api/necessidades', expect.objectContaining({ method: 'POST' }));

      await updateNecessidade(3, 'Diabetes Tipo 1');
      expect(fetch).toHaveBeenCalledWith('/api/necessidades/3', expect.objectContaining({ method: 'PUT' }));

      fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 204 })));
      await deleteNecessidade(3);
      expect(fetch).toHaveBeenCalledWith('/api/necessidades/3', expect.objectContaining({ method: 'DELETE' }));

      await associarNecessidadesAoAluno(7, [1, 2]);
      expect(fetch).toHaveBeenCalledWith('/api/alunos/7/necessidades', expect.objectContaining({ method: 'POST' }));

      fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 204 })));
      await desassociarAlunoDaNecessidade(1, 7);
      expect(fetch).toHaveBeenCalledWith('/api/necessidades/1/alunos', expect.objectContaining({ method: 'DELETE' }));
    });

    it('CRUD de alunos', async () => {
      mockFetchJson({ data: [] });

      await getAlunos(1, 100);
      expect(fetch).toHaveBeenCalledWith('/api/alunos?page=1&limit=100', expect.any(Object));

      await addAluno({ nome: 'Aluno 1' });
      expect(fetch).toHaveBeenCalledWith('/api/alunos', expect.objectContaining({ method: 'POST' }));

      await updateAluno(5, { nome: 'Aluno Editado' });
      expect(fetch).toHaveBeenCalledWith('/api/alunos/5', expect.objectContaining({ method: 'PUT' }));

      fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 204 })));
      await deleteAluno(5);
      expect(fetch).toHaveBeenCalledWith('/api/alunos/5', expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Categorias e Turmas', () => {
    it('CRUD de categorias e turmas', async () => {
      mockFetchJson({ data: [] });

      await updateCategoria(2, 'Integral');
      expect(fetch).toHaveBeenCalledWith('/api/categorias/2', expect.objectContaining({ method: 'PUT' }));

      fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 204 })));
      await deleteCategoria(2);
      expect(fetch).toHaveBeenCalledWith('/api/categorias/2', expect.objectContaining({ method: 'DELETE' }));

      await getTurmas(1, 50);
      expect(fetch).toHaveBeenCalledWith('/api/turmas?page=1&limit=50', expect.any(Object));

      await addTurma({ nome_turma: '1º A' });
      expect(fetch).toHaveBeenCalledWith('/api/turmas', expect.objectContaining({ method: 'POST' }));

      await updateTurma(8, { nome_turma: '1º B' });
      expect(fetch).toHaveBeenCalledWith('/api/turmas/8', expect.objectContaining({ method: 'PUT' }));

      fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 204 })));
      await deleteTurma(8);
      expect(fetch).toHaveBeenCalledWith('/api/turmas/8', expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Contagem Matinal e NES', () => {
    it('getContagensDeHoje, addContagem e updateContagem', async () => {
      mockFetchJson({ data: [] });

      await getContagensDeHoje();
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/contagens?data='), expect.any(Object));

      await addContagem({ quantidade: 25, turmaId: 3 });
      expect(fetch).toHaveBeenCalledWith('/api/contagens', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ qtd_contagem: 25, turmas_id: 3 }),
      }));

      await updateContagem(12, { quantidade: 30 });
      expect(fetch).toHaveBeenCalledWith('/api/contagens/12', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ qtd_contagem: 30 }),
      }));

      await saveContagemOperation({ turmas_id: 3, qtd_contagem: 25, presencas: [] }, '2f4f4383-8ff0-4d91-a1c9-b3b9a6a1c901');
      expect(fetch).toHaveBeenCalledWith('/api/contagens/operacao', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Idempotency-Key': '2f4f4383-8ff0-4d91-a1c9-b3b9a6a1c901' }),
        body: JSON.stringify({ turmas_id: 3, qtd_contagem: 25, presencas: [] }),
      }));
    });

    it('Contagem de Necessidades Especiais (NES)', async () => {
      mockFetchJson({ data: [] });

      await getAlunosContagemNes();
      expect(fetch).toHaveBeenCalledWith('/api/contagem-nes', expect.any(Object));

      await getAlunosContagemNes('2026-09-07');
      expect(fetch).toHaveBeenCalledWith('/api/contagem-nes?data=2026-09-07', expect.any(Object));

      await addAlunoNaContagemNes(10, 4);
      expect(fetch).toHaveBeenCalledWith('/api/contagem-nes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ contagem_id: 10, alunos_has_necessidades_id: 4 }),
      }));

      fetch.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 204 })));
      await removeAlunoDaContagemNes(4);
      expect(fetch).toHaveBeenCalledWith('/api/contagem-nes/4', expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Dashboard e Relatórios', () => {
    it('getContagensDashboard, getContagensPorRange, getDashboardPorData, getAlunosNesPorData', async () => {
      mockFetchJson({ data: [] });

      await getContagensDashboard();
      expect(fetch).toHaveBeenCalledWith('/api/contagens/dashboard', expect.any(Object));

      await getContagensDashboard('2026-09-07');
      expect(fetch).toHaveBeenCalledWith('/api/contagens/dashboard?data=2026-09-07', expect.any(Object));

      await getContagensPorRange('2026-09-01', '2026-09-04');
      expect(fetch).toHaveBeenCalledWith('/api/contagens?data_inicio=2026-09-01&data_fim=2026-09-04', expect.any(Object));

      await getDashboardPorData('2026-09-02');
      expect(fetch).toHaveBeenCalledWith('/api/contagens/dashboard?data=2026-09-02', expect.any(Object));

      await getAlunosNesPorData('2026-09-02');
      expect(fetch).toHaveBeenCalledWith('/api/contagem-nes?data=2026-09-02', expect.any(Object));
    });
  });

  describe('Contexto escolar', () => {
    it('consulta o dia escolar autenticado', async () => {
      mockFetchJson({ data: { data_atual: '2026-09-07', timezone: 'America/Sao_Paulo', agora: '2026-09-08T01:00:00.000000Z' } });

      await getContextoEscolar();
      expect(fetch).toHaveBeenCalledWith('/api/contexto-escolar', expect.any(Object));
    });
  });

  describe('Chat Operacional', () => {
    it('getChatMessages, getChatMessagesPage, sendMessage, getChatMembers, getChatContacts', async () => {
      mockFetchJson({ data: [] });

      await getChatMessages();
      expect(fetch).toHaveBeenCalledWith('/api/chats', expect.any(Object));

      const controller = new AbortController();
      await getChatMessagesPage(2, 20, { signal: controller.signal });
      expect(fetch).toHaveBeenCalledWith('/api/chats?page=2&limit=20', expect.objectContaining({
        signal: controller.signal,
      }));

      await sendMessage({ mensagem_chat: 'Olá' });
      expect(fetch).toHaveBeenCalledWith('/api/chats', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ mensagem_chat: 'Olá' }),
      }));

      await getChatMembers();
      expect(fetch).toHaveBeenCalledWith('/api/getMembers', expect.any(Object));

      await getChatContacts();
      expect(fetch).toHaveBeenCalledWith('/api/users?limit=100', expect.any(Object));
    });
  });
});
