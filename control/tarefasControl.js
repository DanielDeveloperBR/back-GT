import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
function tarefasControl(app) {
    // Mostrar tarefas
    app.get('/tarefas', exibir)
    function exibir(request, response) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const result = await db.all('SELECT * FROM tarefas')
            response.send(result)
            // res.cookie('cookieName', 'cookieValue', { sameSite: 'none', secure: true})
            db.close()
        })()
    }
    // Adicionar tarefas
    app.post('/tarefas', inserir)
    function inserir(request, response) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            await db.run(`INSERT INTO tarefas (tarefa, data_hora) VALUES (?,?)`, request.body.tarefa, request.body.data_hora)
            response.send(`Tarefa: ${request.body.nome} inserida com sucesso.`)
            db.close()
        })()
    }
    // buscar tarefas
    app.get('/tarefas/id/:id', buscarTarefa)
    function buscarTarefa(req, res) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const result = await db.all('SELECT * FROM tarefas where id like ?', req.params.id)
            if (result != '') {
                res.send(result)
            } else {
                res.send(`Tarefa: ${req.params.tarefa} não encontrado`)
            }
            db.close()
        })()
    }
    // deletar tarefas
    app.delete('/tarefas/id/:id', deletar)
    function deletar(req, res) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const result = await db.all('SELECT * FROM tarefas where id like ?', req.params.id)
            if (result != '') {
                res.send(`Tarefa: ${req.params.id} deletada`)
                await db.run('DELETE from tarefas WHERE id = ?', req.params.id)
            } else {
                res.send(`Tarefa: ${req.params.id} não encontrada`)
            }
            db.close()
        })()
    }
    // Editar tarefas
    app.put('/tarefas/id/:id', Atualizar)
    function Atualizar(req, res) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const result = await db.all('SELECT * FROM tarefas where id like ?', req.params.id)
            if (result != '') {
                res.send(`Tarefa: ${req.params.id} Atualizada`)
                await db.run('UPDATE tarefas SET tarefa = ?, data_hora = ? WHERE id = ?', req.body.tarefa, req.body.data_hora, req.params.id)
            } else {
                res.send(`Tarefa: ${req.params.id} não encontrada`)
            }
            db.close()
        })()
    }
}
export default tarefasControl