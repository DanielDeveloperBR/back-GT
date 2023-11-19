import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt'
function clienteControl(app) {
    // Exibir o usuario
    app.get('/usuario', exibir)
    function exibir(request, response) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const result = await db.all('SELECT * FROM clienteUsuario')
            response.send(result)
            db.close()
        })()
    }
    // cadastrar um novo usuario
    app.post('/usuario', inserir)
    function inserir(request, response) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            try {
                const senha = request.body.senha
                const senhaCriptografada = await bcrypt.hash(senha, 10)
                await db.run(`INSERT INTO clienteUsuario (nome,senha,email,cep,bairro,cidade, endereco,estado) VALUES (?,?,?,?,?,?,?,?)`, request.body.nome, senhaCriptografada, request.body.email, request.body.cep, request.body.bairro, request.body.cidade, request.body.endereco, request.body.estado)

                const insertedUser = await db.get('SELECT * FROM clienteUsuario WHERE email = ?', request.body.email);

                response.json({
                    message: `Usuário ${insertedUser.nome} inserido com sucesso.`,
                    user: insertedUser
                });
            } catch (error) {
                response.status(500).json({ error: 'Erro ao inserir usuário.' });
            } finally {
                db.close();
            }
        })()
    }
}
export default clienteControl