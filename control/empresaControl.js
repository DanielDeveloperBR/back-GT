import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt'
import multer from 'multer';
import path from 'path';
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
    // Filtrar e só aceita essas extensoes
    const fileFilter = (req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png']

        if (!allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) {
            return cb(new Error('Apenas imagens com .jpg, .jpeg, ou .png .'))
        }

        cb(null, true);
    };

    // Limite máximo do tamanho dos arquivos
    const limits = {
        // Limite de 1MB
        fileSize: 1024 * 1024 * 50
    };
    // Fazendo a conversão para salvar a imagem com a extensão
    const storage = multer.diskStorage({
        destination: 'uploads/',
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
    // const upload = multer({ storage: storage })
    const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
    });
    // cadastrar um novo usuario
    app.post('/empresa', upload.single('imagemPerfil'), inserir)
    function inserir(request, response) {
        (async () => {
            try {
                const db = await open({
                    filename: './lib/gt.db',
                    driver: sqlite3.Database,
                });

                const senhaCriptografada = await bcrypt.hash(request.body.senha, 10);

                const imagemPerfil = request.file ? request.file.path : null

                if (imagemPerfil === null) {
                    // Se não houver imagemPerfil, trate conforme necessário (por exemplo, forneça um valor padrão ou retorne um erro)
                    return response.status(422).send({ error: 'ImagemPerfil não fornecido' })
                }
                await db.run(`INSERT INTO clienteEmpresa (nome,empresa,senha,email,cnpj,cep,bairro,cidade, endereco,estado, imagemPerfil) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                    request.body.nome, request.body.empresa, senhaCriptografada, request.body.email, request.body.cnpj, request.body.cep, request.body.bairro, request.body.cidade, request.body.endereco, request.body.estado, imagemPerfil)
                response.send(`Usuario: ${request.body.empresa} inserida com sucesso.`);
                db.close();
            } catch (error) {
                console.error('Erro:', error);
                response.status(500).send('Erro interno no servidor.');
            }
        })();
    }


    // Pagina de agendamento da empresa
    app.get('/agendamento', mostrarHTML)
    function mostrarHTML(req, res) {
        console.log('Renderizando página de agendamento...');

        if (req.session.loggedUser) {
            // Se o usuário estiver autenticado, renderize a página
            res.render('agendamento', { user: req.session.loggedUser });
        } else {
            // Se o usuário não estiver autenticado, redirecione para a página de login
            res.redirect('/login.html');  // Substitua 'login.html' pela sua página de login
        }
    }

}
export default empresaControl