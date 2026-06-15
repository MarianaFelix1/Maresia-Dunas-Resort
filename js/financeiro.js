// ============================================
// FINANCEIRO — MARESIA DUNAS RESORT (INTEGRADO API)
// ============================================

const API_FINANCEIRO = 'http://localhost:3001/api/financeiro';
let lancamentos = [];

function hojeISO(){
    return new Date().toISOString().split('T')[0];
}

function formatarMoeda(valor){
    return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarData(dataISO){
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// 1. BUSCAR LANÇAMENTOS DO BANCO DE DADOS (COM FILTROS)
async function loadLancamentos() {
    try {
        const filtroTipo = document.getElementById('filtroTipo').value;
        const termo = document.getElementById('pesquisa').value.trim();

        // Constrói os parâmetros de busca para a URL
        let url = API_FINANCEIRO;
        const params = new URLSearchParams();
        if (filtroTipo) params.append('tipo', filtroTipo);
        if (termo) params.append('pesquisa', termo);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao obter lançamentos do servidor.');

        lancamentos = await response.json();
        renderLancamentos();
    } catch (error) {
        console.error(error);
        alert('Erro ao carregar os dados financeiros do banco de dados.');
    }
}

// 2. RENDERIZAR OS DADOS NA TABELA
function renderLancamentos() {
    const tbody = document.getElementById('listaLancamentos');
    if (!tbody) return;

    if (lancamentos.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6" style="text-align:center; padding:30px; color:var(--oceano-claro)">Nenhum lançamento encontrado nesta consulta.</td>
            </tr>
        `;
        atualizarResumo();
        return;
    }

    tbody.innerHTML = lancamentos.map(l => `
        <tr>
            <td>${l.descricao}</td>
            <td>${l.categoria}</td>
            <td>${formatarData(l.data)}</td>
            <td>
                <span class="tipo-tag ${l.tipo === 'Receita' ? 'receita' : 'despesa'}">
                    <i class="ti ti-${l.tipo === 'Receita' ? 'trending-up' : 'trending-down'}"></i>
                    ${l.tipo}
                </span>
            </td>
            <td class="valor ${l.tipo === 'Receita' ? 'receita' : 'despesa'}">
                ${l.tipo === 'Receita' ? '+' : '-'} ${formatarMoeda(l.valor)}
            </td>
            <td>
                <button class="action-btn" onclick="excluirLancamento(${l.id})" title="Excluir">
                    <i class="ti ti-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    atualizarResumo();
}

// 3. CALCULAR E ATUALIZAR OS CARDES DO RESUMO SUPERIOR
function atualizarResumo() {
    const totalReceitas = lancamentos
        .filter(l => l.tipo === 'Receita')
        .reduce((soma, l) => soma + Number(l.valor), 0);

    const totalDespesas = lancamentos
        .filter(l => l.tipo === 'Despesa')
        .reduce((soma, l) => soma + Number(l.valor), 0);

    document.getElementById('totalReceitas').textContent = formatarMoeda(totalReceitas);
    document.getElementById('totalDespesas').textContent = formatarMoeda(totalDespesas);
    document.getElementById('saldo').textContent = formatarMoeda(totalReceitas - totalDespesas);
}

// 4. SUBMETER NOVO LANÇAMENTO PARA O BACK-END (POST)
async function salvarLancamento() {
    const descricao = document.getElementById('descricao').value.trim();
    const categoria = document.getElementById('categoria').value.trim();
    const tipo = document.getElementById('tipo').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const data = document.getElementById('data').value;

    if (!descricao || !categoria || !data || isNaN(valor) || valor <= 0) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
    }

    const payload = { descricao, categoria, tipo, valor, data };

    try {
        const response = await fetch(API_FINANCEIRO, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro);

        alert(resultado.mensagem);
        fecharModal();
        loadLancamentos(); // Atualiza a tabela com o registo inserido
    } catch (error) {
        alert(error.message || 'Erro ao guardar lançamento financeiro.');
    }
}

// 5. APAGAR REGISTO DO BANCO DE DADOS (DELETE)
async function excluirLancamento(id) {
    if (!confirm('Deseja realmente eliminar este lançamento financeiro?')) return;

    try {
        const response = await fetch(`${API_FINANCEIRO}/${id}`, { method: 'DELETE' });
        const resultado = await response.json();

        if (!response.ok) throw new Error(resultado.erro);

        alert(resultado.mensagem);
        loadLancamentos();
    } catch (error) {
        alert(error.message || 'Erro ao remover o lançamento.');
    }
}

// ============================================
// CONTROLES VISUAIS (MODAL)
// ============================================
function abrirModal(){ document.getElementById('modal').classList.add('active'); }
function fecharModal(){ document.getElementById('modal').classList.remove('active'); limparFormulario(); }

function limparFormulario(){
    document.getElementById('descricao').value = '';
    document.getElementById('categoria').value = '';
    document.getElementById('tipo').selectedIndex = 0;
    document.getElementById('valor').value = '';
    document.getElementById('data').value = hojeISO();
}

document.addEventListener('DOMContentLoaded', () => {
    if (!verificarAcesso('financeiro.html')) return;
    renderSidebar('financeiro.html');
    
    // Procura inicial
    loadLancamentos();

    document.getElementById('novoLancamento').addEventListener('click', () => {
        limparFormulario();
        abrirModal();
    });

    document.getElementById('salvar').addEventListener('click', salvarLancamento);
    document.getElementById('fechar').addEventListener('click', fecharModal);

    // Eventos para escutar os filtros em tempo real
    document.getElementById('filtroTipo').addEventListener('change', loadLancamentos);
    document.getElementById('pesquisa').addEventListener('input', loadLancamentos);

    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') fecharModal();
    });
});