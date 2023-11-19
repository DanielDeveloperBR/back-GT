import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
function agendamento(app) {
    // Exibir o dia, mês hora e minuto do agendamento
    app.get('/agendamento', exibir)
    function exibir(request, response) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const result = await db.all('SELECT dia,mes,hora,hora,minuto FROM agendamento')
            response.send(result)
            db.close()
        })()
    }
    app.get('/agendamentos', obterAgendamentos);
    async function obterAgendamentos(req, res) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            });
            // const idUsuario = req.session.loggedUser.id_usuario;
            const agendamentos = await db.all(`SELECT a.*, ce.nome AS nome_empresa FROM agendamento a JOIN clienteEmpresa ce ON a.id_empresa = ce.id_empresa`)
            res.json(agendamentos);
            db.close();
        } catch (error) {
            console.error('Erro ao obter agendamentos:', error);
            res.status(500).json({ error: 'Erro interno ao obter agendamentos.' });
        }
    }



    // Agendamento
    app.post('/agendamento', inserir);
    async function inserir(request, response) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            });

            const { nome, dia, mes, hora, minuto, id_empresa } = request.body;

            await db.run('INSERT INTO agendamento (nome, dia, mes, hora, minuto, id_empresa) VALUES (?, ?, ?, ?, ?, (SELECT id_empresa FROM clienteEmpresa WHERE id_empresa = ?))', nome, dia, mes, hora, minuto, id_empresa);

            response.send(`Agendamento: ${nome} inserido com sucesso.`);
            db.close();
        } catch (error) {
            console.error('Erro ao inserir agendamento:', error);
            response.status(500).json({ error: 'Erro interno ao inserir agendamento.' });
        }
    }
}
export default agendamento