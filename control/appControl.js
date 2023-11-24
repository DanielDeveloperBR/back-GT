import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import session, { Cookie } from 'express-session';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt'
function appControl(app) {
    app.use(session({
        secret: 'chave braba',
        resave: true,
        saveUninitialized: false,
        cookie: {
            secure: false,
            httpOnly: true,
            // expires: 60000
        },
    }))
    app.use(cookieParser());

    app.post('/app/login', login)
    async function login(request, response) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            });

            console.log('Dados recebidos:', request.body);
            let user;
            const tipoUsuario = request.body.tipo
            console.log('tipo do usuario: ', tipoUsuario)
            if (request.body.tipo === 'empresa') {
                user = await db.get('SELECT * FROM clienteEmpresa WHERE email = ?', request.body.email);
                if (user && await bcrypt.compare(request.body.senha, user.senha)) {
                    // Obtém o id_empresa da empresa
                    const { id_empresa } = user;
                    // Salva o id_empresa na sessão
                    request.session.loggedUser = { ...user, id_empresa };
                    response.cookie('userID', id_empresa, { maxAge: 3600000 });
                    response.status(200).json({ tipoUsuario, user: request.session.loggedUser });
                    return
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    response.status(401).json({ error: 'Credenciais inválidas.' });
                    return
                }
            } else if (request.body.tipo === 'cliente') {
                user = await db.get('SELECT * FROM clienteUsuario WHERE email = ?', request.body.email)
            }
            console.log('Usuário do tipo', request.body.tipo, ':', user);
            if (user && (await bcrypt.compare(request.body.senha, user.senha))) {
                request.session.loggedUser = user;
                response.cookie('userID', user.id_usuario, { maxAge: 3600000 });
                response.status(200).json({ tipoUsuario, user: request.session.loggedUser });
                return
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
                response.status(401).json({ error: 'Credenciais inválidas.' });
                return
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
            response.redirect('/index.html')
            console.log("saiu com sucesso: " + request.session)
        });
    }
}
export default appControl