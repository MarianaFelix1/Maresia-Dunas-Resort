// ============================================
// RESERVAS — MARESIA DUNAS RESORT (INTEGRADO API)
// ============================================

const API_RESERVAS = 'http://localhost:3001/api/reservas';
const API_HOSPEDES = 'http://localhost:3001/api/hospedes';
const API_QUARTOS   = 'http://localhost:3001/api/quartos';

let reservas = [];
let listaHospedesOpcoes = [];
let listaQuartosOpcoes = [];

const ICONES_QUARTO = {
    'Suíte Oceano': 'ti-waves',
    'Suíte Solarium': 'ti-sun',
    'Bangalô Duna': 'ti-tent',
    'Suíte Presidencial': 'ti-crown',
};

function statusClasse(status) {
    switch(status) {
        case 'Ativa': return 'ativa';
        case 'Check-in Hoje': return 'checkin';
        case 'Check-out Hoje': return 'checkout';
        default: return '';
    }
}

function formatarData(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
    return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Carrega os dados iniciais cruzados das APIs
async function loadDados() {
    try {
        const [resReservas, resHospedes, resQuartos] = await Promise.all([
            fetch(API_RESERVAS),
            fetch(API_HOSPEDES),
            fetch(API_QUARTOS)
        ]);

        reservas = await resReservas.json();
        listaHospedesOpcoes = await resHospedes.json();
        listaQuartosOpcoes = await resQuartos.json();

        popularSelects();
        renderReservas();
    } catch (error) {
        console.error(error);
        alert('Erro ao conectar ao servidor para carregar o módulo de reservas. Certifique-se de que o back-end rodando na porta 3001.');
    }
}

// Preenche os selects do modal dinamicamente com dados reais do MySQL
function popularSelects() {
    const selectHospede = document.getElementById('hospede');
    const selectQuarto = document.getElementById('quarto');

    if (selectHospede) {
        selectHospede.innerHTML = '<option value="">Selecione um hóspede...</option>' +
            listaHospedesOpcoes.map(h => `<option value="${h.id}">${h.nome} (CPF: ${h.cpf})</option>`).join('');
    }

    if (selectQuarto) {
        selectQuarto.innerHTML = '<option value="">Selecione um quarto...</option>' +
            listaQuartosOpcoes.map(q => `<option value="${q.id}" data-cap="${q.capacidade}" data-tipo="${q.tipo}">Quarto ${q.numero} - ${q.tipo}</option>`).join('');
    }
}

function renderReservas() {
    const grid = document.getElementById('reservasGrid');
    if (!grid) return;

    if (reservas.length === 0) {
        grid.innerHTML = '<p class="empty-msg">Nenhuma reserva cadastrada.</p>';
        atualizarEstatisticas();
        return;
    }

    grid.innerHTML = reservas.map(r => `
        <div class="reserva-card">
            <div class="reserva-header">
                <div>
                    <h3>${r.hospede_nome}</h3>
                    <div class="quarto-nome">
                        <i class="ti ${ICONES_QUARTO[r.quarto_tipo] || 'ti-bed'}"></i> Quarto ${r.quarto_numero} (${r.quarto_tipo})
                    </div>
                </div>
            </div>

            <p><i class="ti ti-login-2"></i> Entrada: ${formatarData(r.entrada)}</p>
            <p><i class="ti ti-logout-2"></i> Saída: ${formatarData(r.saida)}</p>
            <p><i class="ti ti-users"></i> ${r.pessoas} ${r.pessoas == 1 ? 'pessoa' : 'pessoas'} <span class="cap-info">(máx. ${r.quarto_capacidade})</span></p>

            <span class="status ${statusClasse(r.status)}">${r.status}</span>

            <div class="reserva-footer">
                <button class="consumo-badge-btn" onclick="abrirModalConsumo(${r.id}, '${r.hospede_nome}', '${r.quarto_numero}')" style="background:#e67e22; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:4px;">
                    <i class="ti ti-shopping-cart"></i> Frigobar
                </button>
                
                <div class="reserva-actions">
                    <button onclick="editarReserva(${r.id})" title="Editar">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button onclick="excluirReserva(${r.id})" title="Excluir">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    atualizarEstatisticas();
}

function atualizarEstatisticas() {
    document.getElementById('totalReservas').textContent = reservas.length;
    document.getElementById('ativas').textContent = reservas.filter(r => r.status === 'Ativa').length;
    document.getElementById('checkin').textContent = reservas.filter(r => r.status === 'Check-in Hoje').length;
    document.getElementById('checkout').textContent = reservas.filter(r => r.status === 'Check-out Hoje').length;
}

function abrirModal() {
    document.getElementById('modal').classList.add('active');
}

function fecharModal() {
    document.getElementById('modal').classList.remove('active');
    limparFormulario();
}

function limparFormulario() {
    document.getElementById('reservaId').value = '';
    document.getElementById('hospede').value = '';
    document.getElementById('quarto').value = '';
    document.getElementById('statusReserva').selectedIndex = 0;
    document.getElementById('entrada').value = '';
    document.getElementById('saida').value = '';
    document.getElementById('pessoas').value = 1;
    document.getElementById('capacidadeHint').textContent = '';
    document.getElementById('modalTitulo').textContent = 'Nova Reserva';
}

function atualizarMaxPessoas() {
    const selectQuarto = document.getElementById('quarto');
    const opcaoSelecionada = selectQuarto.options[selectQuarto.selectedIndex];
    
    if (!opcaoSelecionada || !opcaoSelecionada.value) {
        document.getElementById('capacidadeHint').textContent = '';
        return;
    }

    const max = parseInt(opcaoSelecionada.getAttribute('data-cap'), 10) || 1;
    const campoPessoas = document.getElementById('pessoas');

    campoPessoas.max = max;
    if (parseInt(campoPessoas.value, 10) > max) {
        campoPessoas.value = max;
    }

    document.getElementById('capacidadeHint').textContent = `Capacidade máxima deste quarto: ${max} ${max == 1 ? 'pessoa' : 'pessoas'}`;
}

function editarReserva(id) {
    const r = reservas.find(res => res.id === id);
    if (!r) return;

    document.getElementById('reservaId').value = r.id;
    document.getElementById('hospede').value = r.hospede_id;
    document.getElementById('quarto').value = r.quarto_id;
    document.getElementById('statusReserva').value = r.status;
    document.getElementById('entrada').value = r.entrada;
    document.getElementById('saida').value = r.saida;
    document.getElementById('pessoas').value = r.pessoas;
    
    atualizarMaxPessoas();
    document.getElementById('modalTitulo').textContent = 'Editar Reserva';

    abrirModal();
}

async function excluirReserva(id) {
    if (!confirm('Deseja realmente excluir esta reserva?')) return;

    try {
        const response = await fetch(`${API_RESERVAS}/${id}`, { method: 'DELETE' });
        const resultado = await response.json();

        if (!response.ok) throw new Error(resultado.erro);

        alert(resultado.mensagem);
        loadDados();
    } catch (error) {
        alert(error.message || 'Erro ao deletar reserva.');
    }
}

async function salvarReserva() {
    const id = document.getElementById('reservaId').value;
    const hospede_id = document.getElementById('hospede').value;
    const quarto_id = document.getElementById('quarto').value;
    const status = document.getElementById('statusReserva').value;
    const entrada = document.getElementById('entrada').value;
    const saida = document.getElementById('saida').value;
    const pessoas = parseInt(document.getElementById('pessoas').value, 10);

    if (!hospede_id || !quarto_id || !entrada || !saida) {
        alert('Por favor, selecione o hóspede, quarto e as datas.');
        return;
    }

    if (saida < entrada) {
        alert('A data de saída não pode ser anterior à data de entrada.');
        return;
    }

    const selectQuarto = document.getElementById('quarto');
    const maxPessoas = parseInt(selectQuarto.options[selectQuarto.selectedIndex].getAttribute('data-cap'), 10) || 1;

    if (isNaN(pessoas) || pessoas < 1 || pessoas > maxPessoas) {
        alert(`Quantidade inválida de pessoas para este quarto (máx. ${maxPessoas}).`);
        return;
    }

    const payload = { hospede_id, quarto_id, pessoas, status, entrada, saida };

    try {
        let response;
        if (id) {
            response = await fetch(`${API_RESERVAS}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            response = await fetch(API_RESERVAS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro);

        alert(resultado.mensagem);
        fecharModal();
        loadDados();
    } catch (error) {
        alert(error.message || 'Erro ao guardar dados da reserva.');
    }
}

// ========================================================
// CONTROLE EXCLUSIVO DE CONSUMO / FRIGOBAR
// ========================================================

async function abrirModalConsumo(reservaId, hospedeNome, quartoNumero) {
    document.getElementById('consumoReservaId').value = reservaId;
    document.getElementById('consumoSubtitulo').textContent = `Hóspede: ${hospedeNome} — Quarto: ${quartoNumero}`;
    
    document.getElementById('consItem').value = '';
    document.getElementById('consQtd').value = 1;
    document.getElementById('consValor').value = '';

    await carregarListaConsumos(reservaId);
    document.getElementById('modalConsumo').classList.add('active');
}

function fecharModalConsumo() {
    document.getElementById('modalConsumo').classList.remove('active');
}

async function carregarListaConsumos(reservaId) {
    const tbody = document.getElementById('listaConsumosCorrentes');
    const totalEl = document.getElementById('totalConsumoAcumulado');

    try {
        const response = await fetch(`${API_RESERVAS}/${reservaId}/consumos`);
        if (!response.ok) throw new Error('Não foi possível obter os consumos do servidor.');
        
        const consumos = await response.json();
        let totalAcumulado = 0;

        if (!consumos || consumos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:gray;">Nenhum item consumido até o momento.</td></tr>`;
            totalEl.textContent = "R$ 0,00";
            return;
        }

        tbody.innerHTML = consumos.map(c => {
            totalAcumulado += parseFloat(c.total);
            const unitario = parseFloat(c.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const totalItem = parseFloat(c.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            
            return `
                <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <td style="padding: 8px;">${c.item} <br> <small style="color:gray; font-size:10px;">${c.data}</small></td>
                    <td style="padding: 8px; text-align: center;">${c.quantidade}</td>
                    <td style="padding: 8px; text-align: right;">R$ ${unitario}</td>
                    <td style="padding: 8px; text-align: right; font-weight:500;">R$ ${totalItem}</td>
                </tr>
            `;
        }).join('');

        totalEl.textContent = "R$ " + totalAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red; padding:10px;">${error.message}</td></tr>`;
    }
}

async function lancarNovoConsumo() {
    const reservaId = document.getElementById('consumoReservaId').value;
    const item = document.getElementById('consItem').value.trim();
    const quantidade = parseInt(document.getElementById('consQtd').value, 10);
    const valor_unitario = parseFloat(document.getElementById('consValor').value);

    if (!item || isNaN(quantidade) || quantidade < 1 || isNaN(valor_unitario) || valor_unitario < 0) {
        alert('Por favor, informe a descrição do item, a quantidade correta e o valor unitário.');
        return;
    }

    try {
        const response = await fetch(`${API_RESERVAS}/${reservaId}/consumos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item, quantidade, valor_unitario })
        });

        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.erro);

        document.getElementById('consItem').value = '';
        document.getElementById('consQtd').value = 1;
        document.getElementById('consValor').value = '';

        await carregarListaConsumos(reservaId);
    } catch (error) {
        alert(error.message);
    }
}

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA DOS EVENTOS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof verificarAcesso === "function" && !verificarAcesso('reservas.html')) return;
    if (typeof renderSidebar === "function") renderSidebar('reservas.html');
    loadDados();

    // Eventos do Modal de Reservas
    const btnNovaReserva = document.getElementById('novaReserva');
    if (btnNovaReserva) btnNovaReserva.addEventListener('click', abrirModal);
    
    const btnFechar = document.getElementById('fechar');
    if (btnFechar) btnFechar.addEventListener('click', fecharModal);
    
    const btnSalvar = document.getElementById('salvar');
    if (btnSalvar) btnSalvar.addEventListener('click', salvarReserva);
    
    const selectQuarto = document.getElementById('quarto');
    if (selectQuarto) selectQuarto.addEventListener('change', atualizarMaxPessoas);

    // Eventos do Modal de Consumo / Frigobar
    const btnLancarConsumo = document.getElementById('btnLancarConsumo');
    if (btnLancarConsumo) btnLancarConsumo.addEventListener('click', lancarNovoConsumo);
    
    const btnFecharConsumo = document.getElementById('fecharConsumo');
    if (btnFecharConsumo) btnFecharConsumo.addEventListener('click', fecharModalConsumo);
});