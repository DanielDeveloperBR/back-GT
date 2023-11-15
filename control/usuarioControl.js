import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import ejs from 'ejs';

function usuarioControl(app) {
    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../views'));
    app.use(cookieParser());
    app.use(session({
        secret: 'chave braba',
        resave: true,
        saveUninitialized: false,
        cookie: {
            secure: false,
            httpOnly: true,
        },
    }));
    app.get('/dashboard', verificarLogin, exibirDashboard);

    function exibirDashboard(request, response) {
        if (request.session.loggedUser) {
            const tipoUsuario = request.session.loggedUser.id_empresa ? 'empresa' : 'cliente';

            response.render(`dashboard_${tipoUsuario}`, { user: request.session.loggedUser }); // Ajuste aqui
        } else {
            response.redirect('/login.html');
        }
    }

    //verificar-login
    app.get('/verificar-login', verificarLogin);

    function verificarLogin(request, response, next) {
        if (request.session.loggedUser) {
            const tipoUsuario = request.session.loggedUser.id_empresa ? 'empresa' : 'cliente';
            console.log('Usuário está logado. Tipo:', tipoUsuario);
            next(); // Permite o acesso se o usuário estiver logado
        } else {
            console.log('Nenhum usuário está logado.');
            if (request.originalUrl === '/dashboard') {
                response.redirect('/login.html');
            } else {
                response.status(401).json({ message: 'Nenhum usuário está logado.', redirect: '/login.html' });
            }
        }
    }

    // Endpoint /usuario/login
    app.post('/usuario/login', login);

    async function login(request, response) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            });
            console.log('Dados recebidos:', request.body);
            let user;
            if (request.body.tipo === 'empresa') {
                user = await db.get('SELECT * FROM clienteEmpresa WHERE email = ? AND senha = ?', request.body.email, request.body.senha);
            } else if (request.body.tipo === 'cliente') {
                user = await db.get('SELECT * FROM clienteUsuario WHERE email = ? AND senha = ?', request.body.email, request.body.senha);
            }
            console.log('Usuário do tipo', request.body.tipo, ':', user);
            const tipoUsuario = request.body.tipo;
            if (user) {
                request.session.loggedUser = user;
                response.cookie('userID', user.id_empresa || user.id_usuario, { maxAge: 3600000 });
                response.setHeader('Content-Type', 'application/json');
                response.render(`dashboard_${tipoUsuario}`, { user: request.session.loggedUser });
            } else {
                response.status(401).json({ error: 'Credenciais inválidas.' });
            }
        } catch (error) {
            console.error('Erro ao realizar o login:', error);
            response.status(500).json({ error: 'Erro interno ao realizar o login.' });
        }
    }
    //logout
    app.get('/logout', logout);

    function logout(request, response) {
        request.session.destroy((err) => {
            if (err) {
                return response.status(500).send('Erro ao fazer logout.');
            }
            response.clearCookie('userID');
            response.send('Logout realizado com sucesso.');
        });
    }
}

export default usuarioControl;