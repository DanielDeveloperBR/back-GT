// Importações
import sqlite3 from 'sqlite3';
import WebSocket from 'ws';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';

// Função para controlar as rotas relacionadas à empresa
function empresaControl(app, wss) {
    // Rota para exibir dados da empresa
    app.get('/empresa', exibir);
    async function exibir(request, response) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database,
            });

            const result = await db.all('SELECT imagemEmpresa FROM clienteEmpresa');
            response.status(200).json({ foto: result });
            db.close();
        } catch (error) {
            console.error('Erro ao exibir dados da empresa:', error);
            response.status(500).send('Erro interno no servidor.');
        }
    }

    // Configuração do multer para upload de imagens
    const fileFilter = (req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
        if (!allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) {
            return cb(new Error('Apenas imagens com .jpg, .jpeg, ou .png .'));
        }
        cb(null, true);
    }

    const storage = multer.diskStorage({
        destination: 'uploads/',
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        },
    });

    const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
    });

    // Rota para cadastrar um novo usuário
    app.post('/empresa', upload.fields([{ name: 'imagemPerfil' }, { name: 'imagemEmpresa' }]), inserir);
    async function inserir(request, response) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database,
            });

            const senhaCriptografada = await bcrypt.hash(request.body.senha, 10);
            const imagemPerfil = request.files['imagemPerfil'] ? request.files['imagemPerfil'][0].path : null;
            const imagemEmpresa = request.files['imagemEmpresa'] ? request.files['imagemEmpresa'][0].path : null;

            if (imagemPerfil === null || imagemEmpresa === null) {
                return response.status(422).send({ error: 'ImagemPerfil ou imagemEmpresa não fornecido' });
            }

            await db.run(
                `INSERT INTO clienteEmpresa (nome, empresa, senha, email, cnpj, cep, bairro, cidade, endereco, estado, imagemPerfil, imagemEmpresa, categoria) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                request.body.nome, request.body.empresa, senhaCriptografada, request.body.email, request.body.cnpj,
                request.body.cep, request.body.bairro, request.body.cidade, request.body.endereco, request.body.estado,
                imagemPerfil, imagemEmpresa, request.body.categoria
            );

            response.send(`Usuário: ${request.body.empresa} inserido com sucesso.`);
            db.close();
        } catch (error) {
            console.error('Erro:', error);
            response.status(500).json({ error: error.message });
        }
    }

    // Rota para a página de agendamento da empresa
    app.get('/agendamento', mostrarHTML);
    function mostrarHTML(req, res) {
        console.log('Renderizando página de agendamento...');

        if (req.session.loggedUser) {
            res.render('agendamento', { user: req.session.loggedUser });
        } else {
            res.redirect('/login.html');
        }
    }
}
export default empresaControl;