import sqlite3 from 'sqlite3';
import WebSocket from 'ws';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

function empresaControl(app, wss) {
    const salasDisponiveis = [];
    const mensagensSala = {};

    // Função para gerar um ID simples
    function gerarIdSimples() {
        const timestamp = new Date().getTime();
        const randomValue = Math.floor(Math.random() * 1000);
        return `${timestamp}_${randomValue}`;
    }
    // Objeto para armazenar mensagens por sala
    const mensagensPorSala = {};

    // Rota para enviar mensagem
    app.post('/api/enviarMensagem', (req, res) => {
        try {
            // Lógica para enviar a mensagem para a sala específica
            const salaId = req.body.salaId;
            const mensagem = req.body.mensagem;

            // Verifica se a sala já existe no objeto, se não, cria um array vazio
            if (!mensagensPorSala[salaId]) {
                mensagensPorSala[salaId] = [];
            }

            // Adiciona a nova mensagem ao array de mensagens da sala
            mensagensPorSala[salaId].push(mensagem);

            // Envie a nova mensagem para todos os clientes na sala usando WebSocket
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'novaMensagem', salaId, mensagem }));
                }
            });

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    });

    // Rota para criar uma nova sala
    app.post('/api/criarSala', async (req, res) => {
        try {
            const novaSala = {
                id: gerarIdSimples(),
                nome: req.body.nome,
            };

            salasDisponiveis.push(novaSala);
            mensagensSala[novaSala.id] = [];

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'novaSala', sala: novaSala }));
                }
            });

            res.status(201).json(novaSala);
        } catch (error) {
            console.error('Erro ao criar sala:', error);
            res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    });

    app.get('/api/salasDisponiveis', async (req, res) => {
        // Lógica para obter a lista de salas disponíveis do seu banco de dados ou onde preferir

        // Suponha que você tenha uma lista de salas disponíveis
        const salasDisponiveis = [
            { id: 'sala1', nome: 'Sala 1' },
            { id: 'sala2', nome: 'Sala 2' },
        ];

        res.status(200).json({ salas: salasDisponiveis });
    });


    app.post('/api/salas', (req, res) => {
        // Lógica para criar uma sala no seu banco de dados ou onde preferir
        const novaSala = {
            id: 'id_gerado', // substitua com o id real gerado para a sala
            nome: req.body.nome,
            // outras informações da sala
        };

        // Envie a informação para o cliente através do WebSocket
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'novaSala', sala: novaSala }));
            }
        });

        res.status(201).json(novaSala);
    });
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
        if (req.session.loggedUser) {
            res.render('agendamento', { user: req.session.loggedUser });
        } else {
            res.redirect('/login.html');
        }
    }
    // Deletar
    app.delete('/empresa/:id', async (req, res) => {
        const id_empresa = req.params.id
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database,
            });
            const empresa = await db.get('SELECT * FROM clienteEmpresa WHERE id_empresa = ?', id_empresa);
            // Remover o agendamento do banco de dados
            await db.run('DELETE FROM clienteEmpresa WHERE id_empresa = ?', id_empresa);

            if (empresa && empresa.imagemPerfil) {
                fs.unlinkSync(empresa.imagemPerfil);
            }
            req.session.destroy((err) => {
                if (err) {
                    console.error('Erro ao destruir a sessão:', err);
                    return res.status(500).json({ success: false, error: 'Erro interno ao excluir usuário.' });
                }
                res.clearCookie('userID');
                res.json({ success: true, message: `${req.body.nome} deletado com sucesso.` });
            });

            db.close();
        } catch (error) {
            console.error('Erro ao remover agendamento:', error);
            res.status(500).json({ success: false, error: 'Erro interno ao remover agendamento.' });
        }
    })
}
export default empresaControl;