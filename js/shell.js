// ============================================
// MARESIA DUNAS RESORT — SHELL (sidebar/topbar)
// ============================================

const MENU_ITEMS = [
    { page: 'dashboard.html',      icon: 'ti-home',     label: 'Dashboard',     roles: ['admin','recepcao'] },
    { page: 'hospedes.html',       icon: 'ti-users',    label: 'Hóspedes',      roles: ['admin','recepcao'] },
    { page: 'quartos.html',        icon: 'ti-bed',      label: 'Quartos',       roles: ['admin','recepcao'] },
    { page: 'reservas.html',       icon: 'ti-calendar', label: 'Reservas',      roles: ['admin','recepcao'] },
    { page: 'financeiro.html',     icon: 'ti-cash',     label: 'Financeiro',    roles: ['admin'] },
    { page: 'configuracoes.html',  icon: 'ti-settings', label: 'Configurações', roles: ['admin', 'recepcao'] }, // <-- LIBERADO PARA AMBOS VEREM NA LATERAL
];

// Páginas restritas — usuários sem permissão são redirecionados
const PAGINAS_RESTRITAS = {
    'financeiro.html': ['admin'],
    'configuracoes.html': ['admin', 'recepcao'], // <-- LIBERADO O ACESSO DE ENTRADA PARA A RECEPÇÃO
};

// ============================================
// CAPACIDADE PADRÃO DOS QUARTOS (configurável em Configurações)
// ============================================

const CAPACIDADES_PADRAO_DEFAULT = {
    'Suíte Oceano': 2,
    'Suíte Solarium': 3,
    'Bangalô Duna': 4,
    'Suíte Presidencial': 6,
};

function getCapacidadesPadrao(){
    const data = localStorage.getItem('maresia_capacidades');
    return data ? JSON.parse(data) : { ...CAPACIDADES_PADRAO_DEFAULT };
}

function getPerfilAtual(){
    return localStorage.getItem('maresia_perfil') || 'recepcao';
}

function getNomeUsuario(){
    return localStorage.getItem('maresia_usuario') || 'Usuário';
}

function rotuloPerfil(perfil){
    return perfil === 'admin' ? 'Administrador Geral' : 'Recepção';
}

function iconePerfil(perfil){
    return perfil === 'admin' ? 'ti-shield-star' : 'ti-headset';
}

// Verifica se o usuário está logado e tem permissão para a página atual
function verificarAcesso(activePage) {
    const perfil = localStorage.getItem('maresia_perfil');

    // 1. Se não houver perfil salvo, manda para o login imediatamente
    if (!perfil) {
        window.location.href = 'login.html';
        return false;
    }

    // 2. Se a página atual exigir regras de bloqueio mapeadas na lista restrita
    if (PAGINAS_RESTRITAS[activePage]) {
        // Se o perfil logado não estiver incluído no array da página correspondente
        if (!PAGINAS_RESTRITAS[activePage].includes(perfil)) {
            alert('Acesso negado. Esta página é restrita apenas para Administradores.');
            window.location.href = 'dashboard.html';
            return false;
        }
    }

    return true;
}

function renderSidebar(activePage){
    const sidebar = document.querySelector('.sidebar');
    if(!sidebar) return;

    const perfil = getPerfilAtual();
    const nome = getNomeUsuario();

    const itemsHtml = MENU_ITEMS
        .filter(item => item.roles.includes(perfil))
        .map(item => `
            <li class="${item.page === activePage ? 'active' : ''}" onclick="window.location.href='${item.page}'">
                <i class="ti ${item.icon}"></i>
                <span>${item.label}</span>
            </li>
        `).join('');

    sidebar.innerHTML = `
        <div class="logo">
            <img src="assets/img/logo-icon.png" alt="Maresia Dunas Resort">
            <div class="logo-text">
                <h2>Maresia</h2>
                <span>Dunas Resort</span>
            </div>
        </div>

        <div class="perfil-badge">
            <i class="ti ${iconePerfil(perfil)}"></i>
            <div class="perfil-info">
                <strong>${nome}</strong>
                <span>${rotuloPerfil(perfil)}</span>
            </div>
        </div>

        <ul>${itemsHtml}</ul>
        <ul class="logout-area">
            <li id="logoutMenuBtn">
                <i class="ti ti-logout"></i>
                <span>Sair</span>
            </li>
        </ul>
    `;

    const logoutMenu = document.getElementById('logoutMenuBtn');
    if(logoutMenu){
        logoutMenu.addEventListener('click', doLogout);
    }
}

function doLogout(){
    if(confirm('Deseja realmente sair?')){
        localStorage.removeItem('maresia_perfil');
        localStorage.removeItem('maresia_usuario');
        localStorage.removeItem('maresia_email');
        window.location.href = 'login.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){
        logoutBtn.addEventListener('click', doLogout);
    }
});

// ============================================
// MODO ESCURO GLOBAL
// ============================================
function aplicarModoEscuro() {
    // Lê a chave de preferência visual salva na máquina do usuário
    const modoEscuroAtivo = localStorage.getItem('maresia_modo_escuro') === 'true';

    if (modoEscuroAtivo) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Garante que roda assim que qualquer página carregar a estrutura do Shell
document.addEventListener('DOMContentLoaded', aplicarModoEscuro);