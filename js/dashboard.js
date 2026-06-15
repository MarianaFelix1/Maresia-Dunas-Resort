// ============================================
// DASHBOARD — MARESIA DUNAS RESORT (INTEGRADO)
// ============================================

const API_DASHBOARD = 'http://localhost:3001/api/dashboard/stats';

async function carregarMétricasDashboard() {
    try {
        const response = await fetch(API_DASHBOARD);
        if (!response.ok) throw new Error('Falha ao obter dados do servidor.');
        
        const dados = await response.json();

        // 1. Atualiza os cartões superiores com dados reais do MySQL
        document.getElementById('totalHospedes').textContent = dados.totalHospedes;
        document.getElementById('totalQuartos').textContent = dados.totalQuartos;
        document.getElementById('totalReservas').textContent = dados.totalReservas;
        document.getElementById('totalReceita').textContent = 
            'R$ ' + dados.receitaEstimada.toLocaleString('pt-BR');

        // 2. Atualiza o indicador de tendência de quartos criando as legendas de status
        const trendQuartos = document.querySelector('.card:nth-child(2) .trend');
        if (trendQuartos) {
            trendQuartos.style.display = 'block';
            trendQuartos.innerHTML = `
                <span style="color: #1B9E92; font-weight:600; margin-right:8px;">● ${dados.quartosDisponiveis} Livres</span> 
                <span style="color: var(--coral); font-weight:600; margin-right:8px;">● ${dados.quartosOcupados} Ocupados</span>
                <span style="color: var(--dourado); font-weight:600;">● ${dados.quartosManutencao} Manut.</span>
            `;
        }

        // 3. Atualiza os painéis inferiores de Ocupação e Atividades
        renderizarOcupacaoCategorias(dados.categorias);
        renderizarNotificacoes(dados.notificacoes);

    } catch (error) {
        console.error(error);
        alert('Erro ao ligar ao servidor para atualizar as métricas do painel.');
    }
}

function renderizarOcupacaoCategorias(categorias) {
    const paineis = document.querySelectorAll('.dash-grid .panel');
    if (paineis.length < 2) return; 
    const painelOcupacao = paineis[1];

    if (!categorias || categorias.length === 0) {
        painelOcupacao.innerHTML = `
            <h3>Ocupação por categoria</h3>
            <p style="color: var(--oceano-claro); font-size: 14px; margin-top: 15px;">Nenhum quarto cadastrado.</p>
        `;
        return;
    }

    let html = '<h3>Ocupação por categoria</h3>';
    categorias.forEach(cat => {
        html += `
            <div class="occupancy-item">
                <div class="top">
                    <span>${cat.tipo}</span>
                    <span>${cat.percentual}%</span>
                </div>
                <div class="occupancy-bar">
                    <span style="width: ${cat.percentual}%"></span>
                </div>
            </div>
        `;
    });
    painelOcupacao.innerHTML = html;
}

function renderizarNotificacoes(notificacoes) {
    const ul = document.getElementById('activityList');
    if (!ul) return;

    if (!notificacoes || notificacoes.length === 0) {
        ul.innerHTML = `<li><span class="text" style="color: var(--oceano-claro)">Nenhuma atividade recente registrada no sistema.</span></li>`;
        return;
    }

    ul.innerHTML = notificacoes.map(notif => {
        let textoNotificacao = '';
        let classeCorBolinha = '';
        
        if (notif.status === 'Check-in Hoje') {
            textoNotificacao = `<strong>Check-in planejado</strong> — ${notif.hospede_nome} no Quarto ${notif.quarto_numero}`;
            classeCorBolinha = ''; 
        } else if (notif.status === 'Check-out Hoje') {
            textoNotificacao = `<strong>Check-out pendente</strong> — ${notif.hospede_nome} liberando o Quarto ${notif.quarto_numero}`;
            classeCorBolinha = 'coral'; 
        } else {
            textoNotificacao = `<strong>Nova Reserva criada</strong> — Cliente ${notif.hospede_nome} alocado no Quarto ${notif.quarto_numero}`;
            classeCorBolinha = 'dourado'; 
        }

        return `
            <li>
                <span class="dot ${classeCorBolinha}"></span>
                <span class="text">${textoNotificacao}</span>
                <span class="time">Agora</span>
            </li>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    if (!verificarAcesso('dashboard.html')) return;
    renderSidebar('dashboard.html');

    const perfil = getPerfilAtual();
    const saudacao = perfil === 'admin' ? 'Bem-vindo, Administrador' : 'Bem-vindo, Recepção';
    document.getElementById('welcomeText').textContent = saudacao;

    carregarMétricasDashboard();
});