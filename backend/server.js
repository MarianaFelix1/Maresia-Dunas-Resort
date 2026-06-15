const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

// Configurações essenciais (Sempre no topo absoluto do arquivo)
app.use(cors());
app.use(express.json());

// ============================================
// ROTA DE LOGIN
// ============================================
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ erro: 'E-mail não cadastrado.' });
        }
        const usuario = rows[0];
        if (usuario.senha !== senha) {
            return res.status(401).json({ erro: 'Senha incorreta.' });
        }
        res.json({
            status: 'sucesso',
            nome: usuario.nome,
            tipo: usuario.tipo
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor: ' + error.message });
    }
});


// ============================================
// ROTAS DE QUARTOS
// ============================================

// 1. LISTAR QUARTOS (GET)
app.get('/api/quartos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM quartos ORDER BY numero ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar quartos: ' + error.message });
    }
});

// 2. CADASTRAR QUARTO (POST)
app.post('/api/quartos', async (req, res) => {
    const { numero, tipo, status, capacidade } = req.body;
    try {
        await db.query(
            'INSERT INTO quartos (numero, tipo, status, capacidade) VALUES (?, ?, ?, ?)', 
            [numero, tipo, status, capacidade]
        );
        res.json({ mensagem: 'Quarto cadastrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Esse número de quarto já está cadastrado.' });
    }
});

// 3. EDITAR QUARTO (PUT)
app.put('/api/quartos/:id', async (req, res) => {
    const { id } = req.params;
    const { numero, tipo, status, capacidade } = req.body;
    try {
        await db.query(
            'UPDATE quartos SET numero = ?, tipo = ?, status = ?, capacidade = ? WHERE id = ?', 
            [numero, tipo, status, capacidade, id]
        );
        res.json({ mensagem: 'Quarto atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar quarto: ' + error.message });
    }
});

// 4. EXCLUIR QUARTO (DELETE)
app.delete('/api/quartos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM quartos WHERE id = ?', [id]);
        res.json({ mensagem: 'Quarto excluído com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao excluir quarto.' });
    }
});


// ============================================
// ROTAS DE HÓSPEDES
// ============================================

// 1. LISTAR COM FILTRO DE PESQUISA (GET)
app.get('/api/hospedes', async (req, res) => {
    const { pesquisa } = req.query;
    try {
        let query = 'SELECT * FROM hospedes';
        let params = [];

        if (pesquisa) {
            query += ' WHERE nome LIKE ? OR cpf LIKE ? OR email LIKE ?';
            const termo = `%${pesquisa}%`;
            params = [termo, termo, termo];
        }

        query += ' ORDER BY nome ASC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar hóspedes: ' + error.message });
    }
});

// 2. CADASTRAR NOVO HÓSPEDE (POST)
app.post('/api/hospedes', async (req, res) => {
    const { nome, cpf, telefone, email } = req.body;
    try {
        await db.query(
            'INSERT INTO hospedes (nome, cpf, telefone, email) VALUES (?, ?, ?, ?)', 
            [nome, cpf, telefone, email]
        );
        res.json({ mensagem: 'Hóspede cadastrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Este CPF já está cadastrado no sistema.' });
    }
});

// 3. EDITAR HÓSPEDE EXISTENTE (PUT)
app.put('/api/hospedes/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, cpf, telefone, email } = req.body;
    try {
        await db.query(
            'UPDATE hospedes SET nome = ?, cpf = ?, telefone = ?, email = ? WHERE id = ?',
            [nome, cpf, telefone, email, id]
        );
        res.json({ mensagem: 'Hóspede atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar dados do hóspede.' });
    }
});

// 4. EXCLUIR HÓSPEDE (DELETE)
app.delete('/api/hospedes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM hospedes WHERE id = ?', [id]);
        res.json({ mensagem: 'Hóspede excluído com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Não é possível excluir o hóspede pois ele possui histórico ou vínculos.' });
    }
});


// ============================================
// ROTAS DE RESERVAS (Banco de Dados MySQL)
// ============================================

// 1. LISTAR RESERVAS COM DETALHES DE HÓSPEDE E QUARTO (GET)
app.get('/api/reservas', async (req, res) => {
    try {
        const query = `
            SELECT 
                r.id, r.pessoas, r.status, 
                DATE_FORMAT(r.entrada, '%Y-%m-%d') AS entrada, 
                DATE_FORMAT(r.saida, '%Y-%m-%d') AS saida,
                h.id AS hospede_id, h.nome AS hospede_nome,
                q.id AS quarto_id, q.numero AS quarto_numero, q.tipo AS quarto_tipo, q.capacidade AS quarto_capacidade
            FROM reservas r
            INNER JOIN hospedes h ON r.hospede_id = h.id
            INNER JOIN quartos q ON r.quarto_id = q.id
            ORDER BY r.entrada DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar reservas: ' + error.message });
    }
});

// 2. CADASTRAR RESERVA (POST)
app.post('/api/reservas', async (req, res) => {
    const { hospede_id, quarto_id, pessoas, status, entrada, saida } = req.body;
    try {
        await db.query(
            'INSERT INTO reservas (hospede_id, quarto_id, pessoas, status, entrada, saida) VALUES (?, ?, ?, ?, ?, ?)',
            [hospede_id, quarto_id, pessoas, status, entrada, saida]
        );
        res.json({ mensagem: 'Reserva cadastrada com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao criar reserva: ' + error.message });
    }
});

// 3. EDITAR RESERVA (PUT)
app.put('/api/reservas/:id', async (req, res) => {
    const { id } = req.params;
    const { hospede_id, quarto_id, pessoas, status, entrada, saida } = req.body;
    try {
        await db.query(
            'UPDATE reservas SET hospede_id = ?, quarto_id = ?, pessoas = ?, status = ?, entrada = ?, saida = ? WHERE id = ?',
            [hospede_id, quarto_id, pessoas, status, entrada, saida, id]
        );
        res.json({ mensagem: 'Reserva atualizada com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar reserva: ' + error.message });
    }
});

// 4. EXCLUIR RESERVA (DELETE)
app.delete('/api/reservas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM reservas WHERE id = ?', [id]);
        res.json({ mensagem: 'Reserva excluída com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao excluir reserva.' });
    }
});


// ========================================================
// ROTA DO DASHBOARD
// ========================================================
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const [hospedesRows] = await db.query('SELECT COUNT(*) AS total FROM hospedes');
        const [quartosRows] = await db.query('SELECT COUNT(*) AS total FROM quartos');
        const [reservasRows] = await db.query("SELECT COUNT(*) AS total FROM reservas WHERE status IN ('Ativa', 'Check-in Hoje')");
        
        const [disponiveisRows] = await db.query("SELECT COUNT(*) AS total FROM quartos WHERE status = 'Disponível'");
        const [ocupadosRows] = await db.query("SELECT COUNT(*) AS total FROM quartos WHERE status = 'Ocupado'");
        const [manutencaoRows] = await db.query("SELECT COUNT(*) AS total FROM quartos WHERE status = 'Manutenção'");

        const totalQuartos = quartosRows[0].total || 1; 
        const totalOcupados = ocupadosRows[0].total || 0;
        const percentualOcupacao = Math.round((totalOcupados / totalQuartos) * 100);

        const queryCategorias = `
            SELECT tipo, COUNT(*) AS total_tipo, SUM(CASE WHEN status = 'Ocupado' THEN 1 ELSE 0 END) AS ocupados_tipo
            FROM quartos 
            GROUP BY tipo
        `;
        const [categoriasRows] = await db.query(queryCategorias);

        const queryNotificacoes = `
            SELECT r.id, r.status, q.numero AS quarto_numero, h.nome AS hospede_nome
            FROM reservas r
            INNER JOIN hospedes h ON r.hospede_id = h.id
            INNER JOIN quartos q ON r.quarto_id = q.id
            ORDER BY r.id DESC LIMIT 4
        `;
        const [notificacoesRows] = await db.query(queryNotificacoes);

        res.json({
            totalHospedes: hospedesRows[0].total,
            totalQuartos: totalQuartos,
            quartosDisponiveis: disponiveisRows[0].total,
            quartosOcupados: totalOcupados,
            quartosManutencao: manutencaoRows[0].total,
            percentualOcupacao: percentualOcupacao,
            totalReservas: reservasRows[0].total,
            receitaEstimada: reservasRows[0].total * 450,
            categorias: categoriasRows.map(c => ({
                tipo: c.tipo,
                percentual: c.total_tipo > 0 ? Math.round((c.ocupados_tipo / c.total_tipo) * 100) : 0
            })),
            notificacoes: notificacoesRows
        });

    } catch (error) {
        res.status(500).json({ erro: 'Erro interno no servidor: ' + error.message });
    }
});


// ========================================================
// ROTAS DO MÓDULO FINANCEIRO (MySQL)
// ========================================================
app.get('/api/financeiro', async (req, res) => {
    try {
        const { tipo, pesquisa } = req.query;
        let query = 'SELECT id, descricao, categoria, tipo, valor, DATE_FORMAT(data, "%Y-%m-%d") as data FROM lancamentos WHERE 1=1';
        let params = [];

        if (tipo) {
            query += ' AND tipo = ?';
            params.push(tipo);
        }

        if (pesquisa) {
            query += ' AND descricao LIKE ?';
            params.push(`%${pesquisa}%`);
        }

        query += ' ORDER BY data DESC, id DESC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar lançamentos: ' + error.message });
    }
});

app.post('/api/financeiro', async (req, res) => {
    try {
        const { descricao, categoria, tipo, valor, data } = req.body;

        if (!descricao || !categoria || !tipo || !valor || !data) {
            return res.status(400).json({ erro: 'Por favor, preencha todos os campos corretamente.' });
        }

        const query = 'INSERT INTO lancamentos (descricao, categoria, tipo, valor, data) VALUES (?, ?, ?, ?, ?)';
        await db.query(query, [descricao, categoria, tipo, valor, data]);

        res.status(201).json({ mensagem: 'Lançamento financeiro registado com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao salvar lançamento: ' + error.message });
    }
});

app.delete('/api/financeiro/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM lancamentos WHERE id = ?', [id]);
        res.json({ mensagem: 'Lançamento removido com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover lançamento: ' + error.message });
    }
});


// ========================================================
// ROTAS DO MÓDULO DE CONFIGURAÇÕES (MySQL)
// ========================================================
app.get('/api/configuracoes', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM sistema_config WHERE id = 1');
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao carregar configurações: ' + error.message });
    }
});

app.put('/api/configuracoes', async (req, res) => {
    try {
        const {
            nomeResort, emailResort, telefoneResort, moedaResort,
            notifReservas, notifManutencao, notifFinanceiro,
            capOceano, capSolarium, capBangalo, capPresidencial
        } = req.body;

        const query = `
            UPDATE sistema_config SET 
                nomeResort = ?, emailResort = ?, telefoneResort = ?, moedaResort = ?,
                notifReservas = ?, notifManutencao = ?, notifFinanceiro = ?,
                capOceano = ?, capSolarium = ?, capBangalo = ?, capPresidencial = ?
            WHERE id = 1
        `;

        await db.query(query, [
            nomeResort, emailResort, telefoneResort, moedaResort,
            notifReservas ? 1 : 0, notifManutencao ? 1 : 0, notifFinanceiro ? 1 : 0,
            parseInt(capOceano) || 4, parseInt(capSolarium) || 4, 
            parseInt(capBangalo) || 4, parseInt(capPresidencial) || 4
        ]);

        res.json({ mensagem: 'Configurações updated na base de dados com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao guardar configurações: ' + error.message });
    }
});


// ========================================================
// ROTAS DE CONSUMO / FRIGOBAR (INTEGRAÇÃO)
// ========================================================

// 1. LISTAR CONSUMOS DE UMA RESERVA ESPECÍFICA
app.get('/api/reservas/:id/consumos', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            'SELECT id, item, quantidade, valor_unitario, (quantidade * valor_unitario) AS total, DATE_FORMAT(data_consumo, "%d/%m/%Y %H:%i") as data FROM consumos WHERE reserva_id = ? ORDER BY id DESC', 
            [id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar consumos: ' + error.message });
    }
});

// 2. ADICIONAR UM ITEM AO CONSUMO DA RESERVA
app.post('/api/reservas/:id/consumos', async (req, res) => {
    try {
        const { id } = req.params;
        const { item, quantidade, valor_unitario } = req.body;

        if (!item || !quantidade || !valor_unitario) {
            return res.status(400).json({ erro: 'Preencha todos os dados do item consumido.' });
        }

        const query = 'INSERT INTO consumos (reserva_id, item, quantidade, valor_unitario) VALUES (?, ?, ?, ?)';
        await db.query(query, [id, item, quantidade, valor_unitario]);

        res.status(201).json({ mensagem: 'Item lançado no frigobar/consumo com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao lançar consumo: ' + error.message });
    }
});


// ============================================
// LIGAR O SERVIDOR (Sempre a ÚLTIMA linha do arquivo!)
// ============================================
app.listen(3001, () => {
    console.log('Servidor do Back-end rodando na porta 3001');
});