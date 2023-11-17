import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import axios from 'axios';
// import ejs from 'ejs';
function usuarioControl(app) {
    // para linux
    // const __filename = new URL(import.meta.url).pathname;
    // para windows
    const __filename = new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
    // para linux
    // const __dirname = path.dirname(__filename);
    // para windows
    const __dirname = path.dirname(__filename).replace(/^\/([A-Z]:)/, '$1');

    app.set('view engine', 'ejs');
    // para linux
    // app.set('views', path.join(__dirname, '../views'));
    // para windows
    app.set('views', path.join(__dirname, '..', 'views'));

    console.log('Caminho absoluto para o diretório de views:', path.join(__dirname, '../views'));

    app.use(cookieParser());
    app.use(session({
        secret: 'chave braba',
        resave: true,
        saveUninitialized: false,
        cookie: {
            secure: false,
            httpOnly: true,
            expires: 60000
        },
    }));
    app.get('/dashboard', verificaAutenticacao, exibirDashboard);
    function verificaAutenticacao(req, res, next) {
        if (req.session.loggedUser) {
            next();
        } else {
            // O usuário não está autenticado, redirecione para a página de login
            res.redirect('/login.html');
        }
    }
    function exibirDashboard(request, response) {
        if (request.session.loggedUser) {
            // Usuário autenticado, redireciona para o dashboard
            const tipoUsuario = request.session.loggedUser.id_empresa ? 'empresa' : 'cliente';
            response.render(`dashboard_${tipoUsuario}`, { user: request.session.loggedUser });
        } else {
            // Usuário não autenticado, redireciona para a página de login
            response.redirect('/login.html');
        }
    }

    // Endpoint /usuario/login
    app.post('/usuario/login', verificaAutenticacaoLogin, login)
    async function verificaAutenticacaoLogin(req, res, next) {
        // Se o usuário já estiver autenticado, redireciona para o dashboard
        if (req.session.loggedUser) {
            return res.redirect('/dashboard');
        }
        next();
    }
    async function login(request, response) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            });
            console.log('Dados recebidos:', request.body);
            let user;
            const tipoUsuario = request.body.tipo;

            if (request.body.tipo === 'empresa') {
                user = await db.get('SELECT * FROM clienteEmpresa WHERE email = ? AND senha = ?', request.body.email, request.body.senha);

                if (user) {
                    // Obtém o id_empresa da empresa
                    const { id_empresa } = user;

                    // Salva o id_empresa na sessão
                    request.session.loggedUser = { ...user, id_empresa };

                    response.cookie('userID', id_empresa, { maxAge: 3600000 });
                    response.setHeader('Content-Type', 'application/json');
                    response.render(`dashboard_${tipoUsuario}`, { user: request.session.loggedUser });
                    return
                } else {
                    response.status(401).json({ error: 'Credenciais inválidas.' });
                    return
                }
            } else if (request.body.tipo === 'cliente') {
                user = await db.get('SELECT * FROM clienteUsuario WHERE email = ? AND senha = ?', request.body.email, request.body.senha);
            }
            console.log('Usuário do tipo', request.body.tipo, ':', user);
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
            response.setHeader('Cache-Control', 'no-store');
            response.redirect('/index.html')
            console.log("saiu com sucesso: " + request.body)
        });
    }
    app.get('/cep/:cep', async (req, res) => {
        try {
            const response = await axios.get(`https://viacep.com.br/ws/${req.params.cep}/json/`);
            if (response.data && !response.data.erro) {
                res.json(response.data);
            } else {
                res.status(404).json({ erro: 'CEP não encontrado' });
            }
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao buscar CEP' });
        }
    });

}

export default usuarioControl;