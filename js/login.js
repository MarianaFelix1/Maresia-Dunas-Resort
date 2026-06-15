// ============================================
// LOGIN — MARESIA DUNAS RESORT (COM MYSQL)
// ============================================

// Removido o objeto fixo USUARIOS porque agora os dados vêm do banco!

const perfilInput = document.getElementById('perfil');
const roleTabs = document.querySelectorAll('.role-tab');
const loginHint = document.getElementById('loginHint');

function atualizarHint(perfil){
    loginHint.innerHTML = "Selecione o perfil e faça login.";
}

roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        roleTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        perfilInput.value = tab.dataset.role;
        document.getElementById('erroLogin').textContent = '';
        atualizarHint(tab.dataset.role);
    });
});

atualizarHint(perfilInput.value);

// Transformamos a função em ASYNC para conseguir usar o AWAIT no fetch
document.getElementById('loginForm').addEventListener('submit', async function(e){
    e.preventDefault();

    const perfil = perfilInput.value; // Pega 'recepcao' ou 'admin' baseado na aba ativa
    const email = document.getElementById('email').value.trim().toLowerCase();
    const senha = document.getElementById('senha').value.trim();
    const erro = document.getElementById('erroLogin');

    if(!email || !senha){
        erro.textContent = 'Preencha email e senha.';
        return;
    }

    try {
        // Envia as informações para o seu back-end Node
        const resposta = await fetch('http://localhost:3001/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        // Se o back-end disser que o e-mail ou senha não batem
        if (!resposta.ok) {
            erro.textContent = dados.erro;
            return;
        }

        // Se o usuário digitou os dados certos, mas tentou logar na aba errada
        // (Ex: digitou o e-mail do admin estando com a aba da recepção ativa)
        if (dados.tipo !== perfil) {
            erro.textContent = `Credenciais inválidas para o perfil ${perfil === 'admin' ? 'Administrador' : 'Recepção'}.`;
            return;
        }

        // Se passou em tudo, limpa as mensagens de erro
        erro.textContent = '';

        // Mantém exatamente os mesmos salvamentos que você estruturou
        localStorage.setItem('maresia_usuario', dados.nome);
        localStorage.setItem('maresia_email', email);
        localStorage.setItem('maresia_perfil', dados.tipo);

        // Manda para o seu dashboard unificado
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Erro na conexão:', error);
        erro.textContent = 'Não foi possível conectar ao servidor. O back-end está ligado?';
    }
});

// Mostrar/Ocultar Senha (Mantido exatamente como você fez)
const toggleSenha = document.getElementById('toggleSenha');
const campoSenha = document.getElementById('senha');

toggleSenha.addEventListener('click', () => {
    if(campoSenha.type === 'password'){
        campoSenha.type = 'text';
        toggleSenha.classList.remove('ti-eye');
        toggleSenha.classList.add('ti-eye-off');
    }else{
        campoSenha.type = 'password';
        toggleSenha.classList.remove('ti-eye-off');
        toggleSenha.classList.add('ti-eye');
    }
});