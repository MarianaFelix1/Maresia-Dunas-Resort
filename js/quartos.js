// ============================================
// QUARTOS — MARESIA DUNAS RESORT
// ============================================
const IMAGENS_QUARTOS = {
    'Suíte Oceano': 'assets/img/suite-oceano.jpg',
    'Suíte Solarium': 'assets/img/suite-solarium.jpg',
    'Bangalô Duna': 'assets/img/bangalo-duna.jpg',
    'Suíte Presidencial':'assets/img/suite-presidencial.jpg'
};

let quartos = [];

const ICONES_TIPO = {
    'Suíte Oceano': 'ti-waves',
    'Suíte Solarium': 'ti-sun',
    'Bangalô Duna': 'ti-tent',
    'Suíte Presidencial': 'ti-crown',
};

// Substituímos o localStorage por uma chamada para a nossa API no Node
async function loadQuartos(){
    try {
        const resposta = await fetch('http://localhost:3001/api/quartos');
        if (!resposta.ok) throw new Error('Erro ao buscar dados do servidor');
        
        quartos = await resposta.json();
        renderQuartos();
    } catch (error) {
        console.error('Erro ao carregar quartos:', error);
        alert('Não foi possível carregar os quartos do banco de dados.');
    }
}

function statusClasse(status){
    switch(status){
        case 'Disponível': return 'disponivel';
        case 'Ocupado': return 'ocupado';
        case 'Manutenção': return 'manutencao';
        default: return '';
    }
}

function renderQuartos(){
    const grid = document.getElementById('quartosGrid');
    if (!grid) return;

    grid.innerHTML = quartos.map(q => `
        <div class="quarto-card">
            <div class="quarto-img">
                <img src="${IMAGENS_QUARTOS[q.tipo] || 'assets/img/default.jpg'}" alt="${q.tipo}">
            </div>
            <div class="quarto-body">
                <div class="quarto-header">
                    <h3>${q.tipo}</h3>
                    <span class="quarto-numero">Nº ${q.numero}</span>
                </div>

                <div class="quarto-info">
                    <p><i class="ti ti-door"></i> Quarto ${q.numero}</p>
                    <p><i class="ti ti-users"></i> ${q.capacidade} ${q.capacidade == 1 ? 'pessoa' : 'pessoas'}</p>
                </div>

                <div class="quarto-footer">
                    <span class="status ${statusClasse(q.status)}">${q.status}</span>

                    <div class="quarto-actions">
                        <button onclick="editarQuarto(${q.id})" title="Editar">
                            <i class="ti ti-edit"></i>
                        </button>
                        <button onclick="excluirQuarto(${q.id})" title="Excluir">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    atualizarEstatisticas();
}

function atualizarEstatisticas(){
    document.getElementById('totalQuartos').textContent = quartos.length;
    document.getElementById('ocupados').textContent = quartos.filter(q => q.status === 'Ocupado').length;
    document.getElementById('disponiveis').textContent = quartos.filter(q => q.status === 'Disponível').length;
    document.getElementById('manutencao').textContent = quartos.filter(q => q.status === 'Manutenção').length;
    document.getElementById('capacidadeTotal').textContent = quartos.reduce((soma, q) => soma + (q.capacidade || 0), 0);
}

function abrirModal(){
    document.getElementById('modal').classList.add('active');
}

function fecharModal(){
    document.getElementById('modal').classList.remove('active');
    limparFormulario();
}

function limparFormulario(){
    document.getElementById('quartoId').value = '';
    document.getElementById('numero').value = '';
    document.getElementById('tipo').selectedIndex = 0;
    document.getElementById('status').selectedIndex = 0;
    document.getElementById('capacidade').value = 2; // Valor padrão direto
    document.getElementById('modalTitulo').textContent = 'Cadastrar Quarto';
}

function editarQuarto(id){
    // O id vindo do banco agora é um número inteiro
    const quarto = quartos.find(q => q.id === Number(id));
    if(!quarto) return;

    document.getElementById('quartoId').value = quarto.id;
    document.getElementById('numero').value = quarto.numero;
    document.getElementById('tipo').value = quarto.tipo;
    document.getElementById('status').value = quarto.status;
    document.getElementById('capacidade').value = quarto.capacidade || 2;
    document.getElementById('modalTitulo').textContent = 'Editar Quarto';

    abrirModal();
}

async function excluirQuarto(id){
    if(!confirm('Deseja realmente excluir este quarto?')) return;

    try {
        const resposta = await fetch(`http://localhost:3001/api/quartos/${id}`, {
            method: 'DELETE'
        });

        if (!resposta.ok) {
            const erroDados = await resposta.json();
            alert(erroDados.erro || 'Erro ao deletar quarto.');
            return;
        }

        // Recarrega do banco para atualizar as estatísticas e os cards
        loadQuartos();
    } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

async function salvarQuarto(){
    const id = document.getElementById('quartoId').value;
    const numero = document.getElementById('numero').value.trim();
    const tipo = document.getElementById('tipo').value;
    const status = document.getElementById('status').value;
    const capacidade = parseInt(document.getElementById('capacidade').value, 10);

    if(!numero){
        alert('Por favor, informe o número do quarto.');
        return;
    }

    if(isNaN(capacidade) || capacidade < 1){
        alert('Por favor, informe uma quantidade válida de pessoas (mínimo 1).');
        return;
    }

    const payload = { numero, tipo, status, capacidade };

    try {
        let url = 'http://localhost:3001/api/quartos';
        let metodo = 'POST';

        // Se tiver ID presente no formulário oculto, vira uma edição (PUT)
        if (id) {
            url = `http://localhost:3001/api/quartos/${id}`;
            metodo = 'PUT';
        }

        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!resposta.ok) {
            const erroDados = await resposta.json();
            alert(erroDados.erro || 'Erro ao processar quarto.');
            return;
        }

        fecharModal();
        loadQuartos(); // Puxa a lista limpa e atualizada direto do MySQL
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Falha na comunicação com o servidor back-end.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if(typeof verificarAcesso === 'function' && !verificarAcesso('quartos.html')) return;
    if(typeof renderSidebar === 'function') renderSidebar('quartos.html');
    
    loadQuartos();

    document.getElementById('novoQuarto').addEventListener('click', () => {
        limparFormulario();
        abrirModal();
    });

    document.getElementById('salvar').addEventListener('click', salvarQuarto);
    document.getElementById('fechar').addEventListener('click', fecharModal);

    document.getElementById('modal').addEventListener('click', (e) => {
        if(e.target.id === 'modal') fecharModal();
    });
});