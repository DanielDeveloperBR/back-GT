import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import session from 'express-session';
import cookieParser from 'cookie-parser';
function usuarioControl(app) {
    app.use(cookieParser());
    app.use(session({
        secret: 'iiosfoamfopaeoifmromokmfas',
        resave: false,
        saveUninitialized: true,
    }));
    app.get('/usuario', exibir)
    function exibir(request, response) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const result = await db.all('SELECT * FROM usuario')
            response.send(result)
            db.close()
        })()
    }
    // FAzer o login
    app.post('/usuario/login', login)
    function login(request, response) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const user = await db.get('SELECT * FROM clienteUsuario WHERE nome = ? AND senha = ?', request.body.nome, request.body.senha);
            db.close();

            if (user) {
                request.session.loggedUser = user;
                response.cookie('userID', user.id, { maxAge: 3600000 });
                response.send(`Usuário ${user.nome} logado com sucesso.`);
            } else {
                response.status(401).send('Credenciais inválidas.');
            }
        })()
    }
    // dasboard rota segura
    app.get('/dashboard', dashboard)
    function dashboard(request, response) {
        (async () => {
            if (request.session.loggedUser) {
                response.send(`Bem-vindo ao dashboard, ${request.session.loggedUser.nome}!`);
            } else {
                response.status(401).send('Acesso não autorizado. Faça login primeiro.');
            }
        }
        )()
    }

    // logout
    app.get('/logout', logout)
    function logout(request, response) {
        request.session.destroy((err) => {
            if (err) {
                return response.status(500).send('Erro ao fazer logout.');
            }
            response.clearCookie('userID');
            response.send('Logout realizado com sucesso.');
        });
    }
    // verificar login está ou nao logado
    app.get('/verificar-login', verificarLogin)
    function verificarLogin(request, response) {
        if (request.session.loggedUser) {
            response.send(`O usuário ${request.session.loggedUser.nome} está logado.`);
        } else {
            response.send('Nenhum usuário está logado.');
        }
    }


    // cadastrar um novo usuario
    app.post('/usuario', inserir)
    function inserir(request, response) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            await db.run(`INSERT INTO clienteUsuario (nome,senha,email,cep,bairro,cidade, endereco,estado) VALUES (?,?,?,?,?,?,?,?)`, request.body.nome, request.body.senha, request.body.email, request.body.cep, request.body.bairro, request.body.cidade, request.body.endereco, request.body.estado)
            response.send(`Usuario: ${request.body.nome} inserida com sucesso.`)
            db.close()
        })()
    }
    app.delete('/usuario/id/:id', deletar)
    function deletar(req, res) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const result = await db.all('SELECT * FROM usuario where id like ?', req.params.id)
            if (result != '') {
                res.send(`Usuario: ${req.params.id} deletada`)
                await db.run('DELETE from usuario WHERE id = ?', req.params.id)
            } else {
                res.send(`Usuario: ${req.params.id} não encontrada`)
            }
            db.close()
        })()
    }
    app.put('/usuario/id/:id', Atualizar)
    function Atualizar(req, res) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const result = await db.all('SELECT * FROM usuario where id like ?', req.params.id)
            if (result != '') {
                res.send(`Usuário: ${req.params.id} Atualizada`)
                await db.run('UPDATE usuario SET nome = ?, senha = ? WHERE id = ?', req.body.nome, req.body.senha, req.params.id)
            } else {
                res.send(`Usuário: ${req.params.id} não encontrada`)
            }
            db.close()
        })()
    }
    app.get('/usuario/id/:id', buscarTitulo)
    function buscarTitulo(req, res) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const result = await db.all('SELECT * FROM usuario where id like ?', req.params.id)
            if (result != '') {
                res.send(result)
            } else {
                res.send(`Usuário com titulo: ${req.params.id} não encontrado`)
            }
            db.close()
        })()
    }
}
export default usuarioControl