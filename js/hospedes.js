// ========================================================
// HÓSPEDES — MARESIA DUNAS RESORT (INTEGRADO API + MÁSCARAS)
// ========================================================

const API_HOSPEDES = 'http://localhost:3001/api/hospedes';
let hospedes = [];

// ========================================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO VISUAL (MÁSCARAS)
// ========================================================

// Formata o número corrido do banco para o padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
function formatarTelefone(tel) {
    if (!tel) return '';
    const limpo = ('' + tel).replace(/\D/g, '');
    if (limpo.length === 11) {
        // Formato Celular: (XX) XXXXX-XXXX
        return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 7)}-${limpo.substring(7)}`;
    } else if (limpo.length === 10) {
        // Formato Fixo: (XX) XXXX-XXXX
        return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 6)}-${limpo.substring(6)}`;
    }
    return tel; // Retorna o original caso não tenha o tamanho padrão
}

// Formata o número corrido do banco para o padrão XXX.XXX.XXX-XX
function formatarCPF(cpf) {
    if (!cpf) return '';
    const limpo = ('' + cpf).replace(/\D/g, '');
    if (limpo.length === 11) {
        return `${limpo.substring(0, 3)}.${limpo.substring(3, 6)}.${limpo.substring(6, 9)}-${limpo.substring(9)}`;
    }
    return cpf; // Retorna o original caso esteja incompleto
}

// Pega nas iniciais do nome para gerar o Avatar redondo
function getInitials(nome){
    if (!nome) return '';
    const partes = nome.trim().split(' ');
    if(partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

// ========================================================
// OPERAÇÕES PRINCIPAIS DA API
// ========================================================

// 1. BUSCAR HÓSPEDES DA BASE DE DADOS (COM FILTRO DE PESQUISA)
async function loadHospedes(pesquisa = '') {
    try {
        const url = pesquisa ? `${API_HOSPEDES}?pesquisa=${encodeURIComponent(pesquisa)}` : API_HOSPEDES;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Erro ao obter hóspedes do servidor.');
        
        hospedes = await response.json();
        renderHospedes();
    } catch (error) {
        console.error(error);
        alert('Erro ao carregar a lista de hóspedes do banco de dados.');
    }
}

// 2. RENDERIZAR OS HÓSPEDES NA TABELA APLICANDO AS MÁSCARAS
function renderHospedes() {
    const tbody = document.getElementById('listaHospedes');
    if (!tbody) return;

    if (hospedes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--oceano-claro)">Nenhum hóspede cadastrado ou encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = hospedes.map(h => `
        <tr>
            <td>
                <div class="hospede-nome">
                    <div class="avatar">${getInitials(h.nome)}</div>
                    <span>${h.nome}</span>
                </div>
            </td>
            <td>${formatarCPF(h.cpf)}</td>
            <td>${formatarTelefone(h.telefone)}</td>
            <td>${h.email}</td>
            <td>
                <button class="action-btn" onclick="editarHospede(${h.id})" title="Editar">
                    <i class="ti ti-edit"></i>
                </button>
                <button class="action-btn" onclick="excluirHospede(${h.id})" title="Excluir" style="color: var(--coral)">
                    <i class="ti ti-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 3. SUBMETER NOVO CADASTRO OU ATUALIZAÇÃO (POST / PUT)
async function salvarHospede() {
    const id = document.getElementById('hospedeId').value;
    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!nome || !cpf || !telefone || !email) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    const payload = { nome, cpf, telefone, email };

    try {
        let response;
        if (id) {
            // Atualização de hóspede existente
            response = await fetch(`${API_HOSPEDES}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Cadastro de novo hóspede
            response = await fetch(API_HOSPEDES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro);

        alert(resultado.mensagem);
        fecharModal();
        loadHospedes(document.getElementById('pesquisa').value);
    } catch (error) {
        alert(error.message || 'Erro ao salvar os dados do hóspede.');
    }
}

// 4. PREENCHER O MODAL PARA EDIÇÃO
function editarHospede(id) {
    const h = hospedes.find(hosp => hosp.id === id);
    if (!h) return;

    document.getElementById('hospedeId').value = h.id;
    document.getElementById('nome').value = h.nome;
    document.getElementById('cpf').value = h.cpf;
    document.getElementById('telefone').value = h.telefone;
    document.getElementById('email').value = h.email;

    document.getElementById('modalTitulo').textContent = 'Editar Hóspede';
    abrirModal();
}

// 5. APAGAR HÓSPEDE (DELETE)
async function excluirHospede(id) {
    if (!confirm('Deseja realmente remover este hóspede do sistema?')) return;

    try {
        const response = await fetch(`${API_HOSPEDES}/${id}`, { method: 'DELETE' });
        const resultado = await response.json();

        if (!response.ok) throw new Error(resultado.erro);

        alert(resultado.mensagem);
        loadHospedes(document.getElementById('pesquisa').value);
    } catch (error) {
        alert(error.message || 'Erro ao remover hóspede.');
    }
}

// ========================================================
// MANIPULAÇÃO VISUAL DA INTERFACE (MODAL / INICIALIZAÇÃO)
// ========================================================
function abrirModal() { document.getElementById('modal').classList.add('active'); }
function fecharModal() { document.getElementById('modal').classList.remove('active'); limparFormulario(); }

function limparFormulario() {
    document.getElementById('hospedeId').value = '';
    document.getElementById('nome').value = '';
    document.getElementById('cpf').value = '';
    document.getElementById('telefone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('modalTitulo').textContent = 'Cadastrar Hóspede';
}

document.addEventListener('DOMContentLoaded', () => {
    if (!verificarAcesso('hospedes.html')) return;
    renderSidebar('hospedes.html');
    
    // Carga inicial dos dados vindos do MySQL
    loadHospedes();

    document.getElementById('novoHospede').addEventListener('click', () => {
        limparFormulario();
        abrirModal();
    });

    document.getElementById('salvar').addEventListener('click', salvarHospede);
    document.getElementById('fechar').addEventListener('click', fecharModal);

    // Filtro dinâmico na barra de pesquisa
    document.getElementById('pesquisa').addEventListener('input', (e) => {
        loadHospedes(e.target.value);
    });

    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') fecharModal();
    });
});