import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt'
function empresaControl(app) {
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
   
    // cadastrar um novo usuario
    app.post('/empresa', inserir)
    function inserir(request, response) {
        (async () => {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const senhaCriptografada = await bcrypt.hash(request.body.senha, 10)
            await db.run(`INSERT INTO clienteEmpresa (nome,empresa,senha,email,cnpj,cep,bairro,cidade, endereco,estado) VALUES (?,?,?,?,?,?,?,?,?,?)`, request.body.nome, request.body.empresa, senhaCriptografada, request.body.email, request.body.cnpj, request.body.cep, request.body.bairro, request.body.cidade, request.body.endereco, request.body.estado)
            response.send(`Usuario: ${request.body.empresa} inserida com sucesso.`)
            db.close()
        })()
    }
}
export default empresaControl