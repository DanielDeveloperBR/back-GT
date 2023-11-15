import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
function usuarioControl(app) {
    app.use(cookieParser());
    app.use(session({
        secret: 'chave braba',
        resave: true,
        saveUninitialized: false,
    }));
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
   
    app.get('/login.html', bloquearAcessoLogin, (request, response) => {
        response.sendFile(path.join(__dirname, '../login.html'));
    });

    function bloquearAcessoLogin(request, response, next) {
        if (request.session.loggedUser) {
            console.log("Usuário já está logado. Redirecionando para o dashboard.");
            response.redirect('/dashboardCliente.html');
        } else {
            // Se o usuário não estiver logado, permite o acesso à página de login
            next();
        }
    }

    // FAzer o login
    app.post('/usuario/login', login)
function login(request, response) {
    (async () => {
        const db = await open({
            filename: './lib/gt.db',
            driver: sqlite3.Database
        })
        let user;
        if (request.body.tipo === 'empresa') {
            user = await db.get('SELECT * FROM clienteEmpresa WHERE email = ? AND senha = ?', request.body.email, request.body.senha);
        } else if (request.body.tipo === 'usuario') {
            user = await db.get('SELECT * FROM clienteUsuario WHERE email = ? AND senha = ?', request.body.email, request.body.senha);
        }
        db.close();

        if (user) {
            request.session.loggedUser = user;
            response.cookie('userID', user.id_empresa || user.id_usuario, { maxAge: 3600000 });
            response.json({ message: `Usuário logado com sucesso.`, redirect: user.id_empresa ? '/dashboardEmpresa.html' : '/dashboardCliente.html' });
        } else {
            response.status(401).send('Credenciais inválidas.');
        }
    })()
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
    app.get('/verificar-login', verificarLogin);
    function verificarLogin(request, response) {
        if (request.session.loggedUser) {
            const redirectUrl = request.session.loggedUser.id_empresa ? '../dashboardEmpresa.html' : '../dashboardCliente.html';
            response.json({ loggedUser: request.session.loggedUser, redirect: redirectUrl });
        } else {
            response.status(401).json({ message: 'Nenhum usuário está logado.', redirect: '/login.html' });
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
}
export default usuarioControl