import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import axios from 'axios';
import bcrypt from 'bcrypt'
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
        secret: 'chavebraba',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            httpOnly: true
            // expires: 60000
        },
    }))
    // Adicione o middleware verificarSessaoDoUsuario antes de rotas que precisam verificar a sessão
    app.use(verificarSessaoDoUsuario);
    // Função para obter o ID da sessão associado a um usuário no banco de dados
    async function getSessionIDFromDatabase(userID) {
        const db = await open({
            filename: './lib/gt.db',
            driver: sqlite3.Database
        });

        const result = await db.get('SELECT sessionID FROM userSessions WHERE userID = ?', userID);
        return result ? result.sessionID : null;
    }

    // Algum ponto onde você queira verificar a sessão do usuário (por exemplo, middleware)
    async function verificarSessaoDoUsuario(req, res, next) {
        const userID = req.session.loggedUser ? (req.session.loggedUser.empresa ? req.session.loggedUser.empresa.id_empresa : req.session.loggedUser.user.id_usuario) : null;

        if (userID) {
            const sessionIDFromDatabase = await getSessionIDFromDatabase(userID);
            const sessionIDFromCookie = req.cookies.sessionID;

            if (sessionIDFromDatabase && sessionIDFromCookie && sessionIDFromDatabase !== sessionIDFromCookie) {
                // A sessão no cookie não corresponde à sessão armazenada no banco de dados
                // Isso pode indicar que o usuário fez login em outro local
                // Realize as ações apropriadas, como fazer logout desta sessão
                // e redirecionar o usuário para fazer login novamente.
                console.log("sessao id da database: ", sessionIDFromDatabase)
                console.log(userID)
                if (userID) {
                    // Remover ID da sessão do banco de dados
                    await storeSessionIDInDatabase(userID);
                }
        
                req.session.destroy((err) => {
                    if (err) {
                        return res.status(500).send('Erro ao fazer logout.');
                    }
        
                    // Limpar cookies
                    res.clearCookie('userID') ? ('empresaID') : null
                    res.clearCookie('empresaID') ? ('userID') : null
                    res.clearCookie('sessionID');
        
                    res.setHeader('Cache-Control', 'no-store');
                    console.log("Saiu com sucesso:", userID);
                    res.redirect('/login.html');
                })

            }
        }

        next();
    }

    // Função para armazenar o ID da sessão no banco de dados
    async function storeSessionIDInDatabase(userID, sessionID) {
        const db = await open({
            filename: './lib/gt.db',
            driver: sqlite3.Database
        });

        await db.run('INSERT OR REPLACE INTO userSessions (userID, sessionID) VALUES (?, ?)', [userID, sessionID]);
    }
    app.get('/dashboard', verificaAutenticacao, exibirDashboard)

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
            const tipoUsuario = request.session.loggedUser.empresa ? 'empresa' : 'cliente';
            if (tipoUsuario === 'empresa') {
                response.render(`dashboard_${tipoUsuario}`, { empresa: request.session.loggedUser.empresa });
            } else if (tipoUsuario === "cliente") {
                response.render(`dashboard_${tipoUsuario}`, { user: request.session.loggedUser });
            }
        } else {
            response.redirect('/login.html');
        }
    }

    function gerarIdentificadorSessao() {
        // Gera um identificador de sessão único usando carimbo de data/hora e parte aleatória
        return new Date().getTime().toString(36) + Math.random().toString(36).substr(2);
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
        let user, empresa
        let tipoUsuario = request.body.tipo
        const db = await open({
            filename: './lib/gt.db',
            driver: sqlite3.Database
        })
        let sessionID = gerarIdentificadorSessao();
        // Empresa
        if (request.body.tipo === 'empresa') {
            empresa = await db.get('SELECT * FROM clienteEmpresa WHERE email = ?', request.body.email)
            if (empresa && await bcrypt.compare(request.body.senha, empresa.senha)) {
                await storeSessionIDInDatabase(empresa.id_empresa, sessionID);
                request.session.loggedUser = { empresa, sessionID };
                response.cookie('empresaID', empresa.id_empresa, { maxAge: 3600000 })
                response.cookie('sessionID', sessionID, { maxAge: 3600000 })
                response.setHeader('Content-Type', 'application/json');
                response.render(`dashboard_${tipoUsuario}`, { empresa: request.session.loggedUser });
                return
            } else {
                response.status(401).json({ error: 'Credenciais inválidas.' });
                return
            }
        }
        // Cliente
        if (request.body.tipo === 'cliente') {
            user = await db.get('SELECT * FROM clienteUsuario WHERE email = ?', request.body.email)
        }
        if (user && await bcrypt.compare(request.body.senha, user.senha)) {
            await storeSessionIDInDatabase(user.id_usuario, sessionID);

            request.session.loggedUser = { user, sessionID }
            response.cookie('userID', user.id_usuario, { maxAge: 3600000 });
            response.cookie('sessionID', sessionID, { maxAge: 3600000 })
            // response.setHeader('Content-Type', 'application/json');
            response.render(`dashboard_${tipoUsuario}`, { user: request.session.loggedUser }, sessionID)
            return
        } else {
            response.status(401).json({ error: 'Credenciais inválidas.' });
            return
        }
    }
    //logout
    app.get('/logout', logout);
    async function logout(request, response) {
        const { loggedUser } = request.session;

        if (loggedUser) {
            // Remover ID da sessão do banco de dados
            await storeSessionIDInDatabase(loggedUser.empresa ? loggedUser.empresa.id_empresa : loggedUser.user.id_usuario, null);
        }

        request.session.destroy((err) => {
            if (err) {
                return response.status(500).send('Erro ao fazer logout.');
            }

            // Limpar cookies
            response.clearCookie('userID');
            response.clearCookie('empresaID');
            response.clearCookie('sessionID');

            response.setHeader('Cache-Control', 'no-store');
            response.redirect('/index.html');
            console.log("Saiu com sucesso:", loggedUser);
        })
    }
    // buscar CEP
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