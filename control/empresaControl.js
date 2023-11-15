import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import session from 'express-session';
import cookieParser from 'cookie-parser';
function empresaControl(app) {
    app.use(cookieParser());
    app.use(session({
        secret: 'chave braba',
        resave: true,
        saveUninitialized: false,
    }));
    app.get('/empresa', exibir)
    function exibir(request, response) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const result = await db.all('SELECT * FROM clienteEmpresa')
            response.send(result)
            db.close()
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

    // cadastrar um novo usuario
    app.post('/empresa', inserir)
    function inserir(request, response) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            await db.run(`INSERT INTO clienteEmpresa (nome,empresa,senha,email,cnpj,cep,bairro,cidade, endereco,estado) VALUES (?,?,?,?,?,?,?,?,?,?)`, request.body.nome, request.body.empresa, request.body.senha, request.body.email, request.body.cnpj, request.body.cep, request.body.bairro, request.body.cidade, request.body.endereco, request.body.estado)
            response.send(`Usuario: ${request.body.empresa} inserida com sucesso.`)
            db.close()
        })()
    }
}
export default empresaControl