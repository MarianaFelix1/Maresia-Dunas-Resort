// ============================================
// CONFIGURAÇÕES — MARESIA DUNAS RESORT (INTEGRADO API)
// ============================================

const API_CONFIG = 'http://localhost:3001/api/configuracoes';
const STORAGE_KEY_ULTIMA_ATUALIZACAO = 'maresia_ultima_atualizacao';

// 1. CARREGAR CONFIGURAÇÕES DA API (MySQL)
async function loadConfig() {
    try {
        const response = await fetch(API_CONFIG);
        if (!response.ok) throw new Error('Erro ao obter dados do servidor.');
        
        const config = await response.json();
        
        // Preencher Dados do Resort
        document.getElementById('nomeResort').value = config.nomeResort || '';
        document.getElementById('emailResort').value = config.emailResort || '';
        document.getElementById('telefoneResort').value = config.telefoneResort || '';
        document.getElementById('moedaResort').value = config.moedaResort || 'BRL';
        
        // Preencher Preferências (Toggles)
        document.getElementById('notifReservas').checked = !!config.notifReservas;
        document.getElementById('notifManutencao').checked = !!config.notifManutencao;
        document.getElementById('notifFinanceiro').checked = !!config.notifFinanceiro;
        
        // Preencher Capacidades dos Quartos
        document.getElementById('capOceano').value = config.capOceano || 4;
        document.getElementById('capSolarium').value = config.capSolarium || 4;
        document.getElementById('capBangalo').value = config.capBangalo || 4;
        document.getElementById('capPresidencial').value = config.capPresidencial || 4;

        // Aplicar Modo Escuro salvo localmente no browser do utilizador
        const modoEscuroAtivo = localStorage.getItem('maresia_modo_escuro') === 'true';
        document.getElementById('modoEscuro').checked = modoEscuroAtivo;
        document.body.classList.toggle('dark-mode', modoEscuroAtivo);

        // Controlar restrição da recepção pós-carregamento
        aplicarRestricoesPerfil();

    } catch (error) {
        console.error(error);
        alert('Erro ao carregar as configurações do servidor.');
    }
}

// 2. CONTROLAR O QUE A RECEPÇÃO PODE OU NÃO VER
function aplicarRestricoesPerfil() {
    const perfil = getPerfilAtual();
    
    // Carrega dados da conta (Sessão)
    document.getElementById('contaNome').value = getNomeUsuario();
    document.getElementById('contaEmail').value = localStorage.getItem('maresia_email') || '';
    document.getElementById('contaPerfil').value = rotuloPerfil(perfil);

    if (perfil === 'recepcao') {
        // Bloquear inputs para edição
        const camposParaBloquear = [
            'nomeResort', 'emailResort', 'telefoneResort', 'moedaResort',
            'notifReservas', 'notifManutencao', 'notifFinanceiro',
            'capOceano', 'capSolarium', 'capBangalo', 'capPresidencial'
        ];
        
        camposParaBloquear.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });

        // Ocultar a secção de Backup e Dados (Botões de exportar, importar e limpar tudo)
        // Encontra o card de Backup pelo título H3 dele
        const cards = document.querySelectorAll('.settings-card');
        cards.forEach(card => {
            const h3 = card.querySelector('h3');
            if (h3 && h3.textContent.includes('Backup e Dados')) {
                card.style.display = 'none'; // Esconde completamente o painel crítico
            }
        });

        // Ocultar os botões inferiores de Salvar e Restaurar alterações
        const acoesGrid = document.querySelector('.settings-actions');
        if (acoesGrid) acoesGrid.style.display = 'none';
    }
}

// 3. ENVIAR ALTERAÇÕES PARA O BANCO (PUT)
async function salvarConfig() {
    const payload = {
        nomeResort: document.getElementById('nomeResort').value.trim(),
        emailResort: document.getElementById('emailResort').value.trim(),
        telefoneResort: document.getElementById('telefoneResort').value.trim(),
        moedaResort: document.getElementById('moedaResort').value,
        notifReservas: document.getElementById('notifReservas').checked,
        notifManutencao: document.getElementById('notifManutencao').checked,
        notifFinanceiro: document.getElementById('notifFinanceiro').checked,
        capOceano: parseInt(document.getElementById('capOceano').value, 10),
        capSolarium: parseInt(document.getElementById('capSolarium').value, 10),
        capBangalo: parseInt(document.getElementById('capBangalo').value, 10),
        capPresidencial: parseInt(document.getElementById('capPresidencial').value, 10)
    };

    try {
        const response = await fetch(API_CONFIG, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro);

        // Salvar Modo Escuro localmente no browser (preferência visual por máquina)
        localStorage.setItem('maresia_modo_escuro', document.getElementById('modoEscuro').checked);

        registrarAtualizacao();
        mostrarMensagem('saveMsg', resultado.mensagem);
    } catch (error) {
        alert(error.message || 'Erro ao salvar configurações.');
    }
}

// 4. RESTAURAR PADRÃO DE FÁBRICA
async function restaurarConfig() {
    if (!confirm('Restaurar todas as configurações e capacidades para o padrão do resort?')) return;

    const padrao = {
        nomeResort: 'Maresia Dunas Resort',
        emailResort: 'contato@maresiadunas.com',
        telefoneResort: '(83) 99999-0000',
        moedaResort: 'BRL',
        notifReservas: true,
        notifManutencao: true,
        notifFinanceiro: false,
        capOceano: 4,
        capSolarium: 4,
        capBangalo: 4,
        capPresidencial: 4
    };

    try {
        const response = await fetch(API_CONFIG, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(padrao)
        });

        if (!response.ok) throw new Error('Erro ao restaurar padrões.');

        localStorage.setItem('maresia_modo_escuro', 'false');
        document.getElementById('modoEscuro').checked = false;
        document.body.classList.remove('dark-mode');

        registrarAtualizacao();
        loadConfig(); // Recarrega os inputs com o padrão
        mostrarMensagem('saveMsg', 'Configurações restauradas para o padrão.');
    } catch (error) {
        alert(error.message);
    }
}

// ============================================
// MANIPULAÇÃO LOCAL DE DADOS (APENAS ADMIN)
// ============================================
function registrarAtualizacao() {
    localStorage.setItem(STORAGE_KEY_ULTIMA_ATUALIZACAO, new Date().toISOString());
    atualizarDataExibida();
}

function atualizarDataExibida() {
    const valor = localStorage.getItem(STORAGE_KEY_ULTIMA_ATUALIZACAO);
    const el = document.getElementById('ultimaAtualizacao');
    if (!el) return;

    if (!valor) {
        el.textContent = 'Nunca';
        return;
    }

    const data = new Date(valor);
    el.textContent = data.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function mostrarMensagem(idElemento, texto) {
    const el = document.getElementById(idElemento);
    if (!el) return;
    el.textContent = texto;
    setTimeout(() => el.textContent = '', 3500);
}

// ============================================
// INICIALIZAÇÃO DO SEU CONFIGURACOES.HTML
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!verificarAcesso('configuracoes.html')) return;
    renderSidebar('configuracoes.html');

    // Carga e verificação inicial
    loadConfig();
    atualizarDataExibida();

    // Eventos dos botões principais
    document.getElementById('salvarConfig').addEventListener('click', salvarConfig);
    document.getElementById('restaurarConfig').addEventListener('click', restaurarConfig);

    // Evento em tempo real do Modo Escuro (Funciona para ambos os perfis)
    document.getElementById('modoEscuro').addEventListener('change', function() {
        document.body.classList.toggle('dark-mode', this.checked);
        localStorage.setItem('maresia_modo_escuro', this.checked);
    });
});