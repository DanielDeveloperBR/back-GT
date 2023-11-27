import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import multer from 'multer';
import path from 'path';
import WebSocket from 'ws';
import nodemailer from 'nodemailer';
// Verificar a disponibilidade para reservar
async function verificarDisponibilidade(db, idEmpresa, hora, minuto) {
    // Altere a consulta SQL na função verificarDisponibilidade
    const count = await db.get(`SELECT COUNT(id_agendamento) as count FROM agendamento WHERE id_empresa = ? AND hora = ? AND minuto = ? AND status_reserva = 0
`, idEmpresa, hora, minuto);


    return count.count === 0;
}

function sendNotificationToCompany(idEmpresa, mensagem) {
    // Implemente a lógica de notificação aqui
    console.log(`Notificação enviada para a empresa ${idEmpresa}: ${mensagem}`);
}
function agendamento(app, wss) {
    wss.on('connection', (ws) => {
        ws.on('message', (message) => {
            // Receba as mensagens do cliente aqui
            const parsedMessage = JSON.parse(message);
            // Adicione a lógica para notificar a empresa quando um agendamento é feito
            if (parsedMessage.action === 'agendamento') {
                sendNotificationToCompany(parsedMessage.idEmpresa, 'Novo agendamento realizado.');
            }
        });
    })
    // Reservar um agendamento o usuarioCliente
    app.post('/reservar-agendamento/:id', async (req, res) => {
        const idAgendamento = req.params.id;
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database,
            });
            const idEmpresa = req.session.loggedUser.id_empresa;
            const { nome, dia, mes, hora, minuto } = req.body;
            // Verifique a disponibilidade antes de inserir
            const horarioDisponivel = await verificarDisponibilidade(db, idEmpresa, hora, minuto)
            await db.run('UPDATE agendamento SET status_reserva = 1 WHERE id_agendamento = ?', idAgendamento);

            await db.run('DELETE FROM agendamento WHERE id_agendamento = ?', idAgendamento)

            if (horarioDisponivel) {
                // Insira o agendamento
                const idUsuario = req.session.loggedUser.id_usuario;
                await db.run(
                    `INSERT INTO agendamento (nome, dia, mes, hora, minuto, id_empresa, id_usuario) VALUES (?, ?, ?, ?, ?, ?, ?)`, nome, dia, mes, hora, minuto, idEmpresa, idUsuario)

                res.json({ Message: `Agendamento: ${nome} inserido com sucesso.` })
                await db.close()
            } else {
                res.status(400).json({ error: 'Horário não disponível. Escolha outro horário.' });
            }
        } catch (error) {
            console.error('Erro ao reservar agendamento:', error);
            res.status(500).json({ success: false, error: 'Erro interno ao reservar agendamento.' });
        }
    })
    // Enviar notificação por email
    app.post('/enviar-notificacao-email/:id', async (req, res) => {
        const idAgendamento = req.params.id;
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database,
            })
            // Lógica para obter detalhes do agendamento usando o ID e obter o e-mail do cliente
            const agendamento = await db.get('SELECT * FROM agendamento WHERE id_agendamento = ?', idAgendamento);

            if (!agendamento) {
                return res.status(404).json({ success: false, error: 'Agendamento não encontrado.' });
            }

            const cliente = await db.get('SELECT * FROM clienteEmpresa');
            // const cliente = await db.get('SELECT * FROM clienteUsuario WHERE id_usuario = ?', agendamento.id_usuario);
            if (!cliente) {
                return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
            }

            // Lógica para enviar notificação por e-mail
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'danieldetrabalho1@gmail.com',
                    pass: 'mpoc rhyp vzpk zqbo'
                }
            })

            const mailOptions = {
                from: 'danieldetrabalho@gmail.com',
                to: cliente.email, // Substitua pela variável que contém o e-mail do cliente
                subject: 'Notificação de Agendamento',
                text: `Seu agendamento ${agendamento.nome} foi confirmado.`
            }

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.error('Erro ao enviar notificação por e-mail:', error);
                    res.status(500).json({ success: false, error: 'Erro interno ao enviar notificação por e-mail.', details: error.message });
                } else {
                    console.log('E-mail enviado:', info.response);
                    res.json({ success: true });
                }
            })
            await db.close()
        } catch (error) {
            console.error('Erro ao enviar notificação por e-mail:', error);
            res.status(500).json({ success: false, error: 'Erro interno ao enviar notificação por e-mail.', details: error.message });
        }
    })

    // Deletar um agendamento
    app.delete('/agendamento/:id', async (req, res) => {
        const idAgendamento = req.params.id;
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database,
            });
            // Remover o agendamento do banco de dados
            await db.run('DELETE FROM agendamento WHERE id_agendamento = ?', idAgendamento);
            // Adicione lógica para enviar notificação para a empresa, se necessário
            res.json({ success: true, message: 'Agendamento removido com sucesso.' });
            db.close();
        } catch (error) {
            console.error('Erro ao remover agendamento:', error);
            res.status(500).json({ success: false, error: 'Erro interno ao remover agendamento.' });
        }
    });
    // Pegar os agendamentos e mostrar no cliente
    app.get('/agendamentos', obterAgendamentos);
    async function obterAgendamentos(req, res) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            });

            const agendamentos = await db.all(`
                SELECT a.*, ce.nome AS nome_empresa, c.nome AS nome_cliente
                FROM agendamento a
                JOIN clienteEmpresa ce ON a.id_empresa = ce.id_empresa
                LEFT JOIN clienteUsuario c ON a.id_usuario = c.id_usuario
            `);

            res.json(agendamentos);  // Corrigido para retornar JSON
            await db.close();
        } catch (error) {
            console.error('Erro ao obter agendamentos:', error);
            res.status(500).json({ error: 'Erro interno ao obter agendamentos.' });
        }
    }

    // Pegar os agendamentos e mostrar para a empresa
    app.get('/agendamento/:id', seusAgendamentos);
    async function seusAgendamentos(req, res) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            });

            const agendamentos = await db.all('SELECT * FROM agendamento WHERE id_empresa = ?', req.params.id);
            if (agendamentos.length > 0) {
                res.json(agendamentos);
            } else {
                res.json({ Message: "Não há agendamentos para esta empresa." });
            }

            await db.close();
        } catch (error) {
            console.error('Erro ao obter agendamentos:', error);
            res.status(500).json({ error: 'Erro interno ao obter agendamentos.' });
        }
    }

    // Cadastrar um novo Agendamento 
    app.post('/agendamento', inserir);
    async function inserir(request, response) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            });
            const idEmpresa = request.session.loggedUser.id_empresa;
            const { nome, dia, mes, hora, minuto } = request.body;

            // Altere a linha abaixo para retornar o ID da empresa
            const { id_empresa } = await db.get('SELECT id_empresa FROM clienteEmpresa WHERE id_empresa = ?', idEmpresa);

            await db.run('INSERT INTO agendamento (nome, dia, mes, hora, minuto, id_empresa) VALUES (?, ?, ?, ?, ?, ?)', nome, dia, mes, hora, minuto, id_empresa);
            console.log("Agendamento " + request.session.loggedUser.user + " " + "com sucesso")
            response.status(200).json({ Mensagem: "Agendamento " + request.session.loggedUser.user + "" + "com sucesso" })
            db.close();
        } catch (error) {
            console.error('Erro ao inserir agendamento:', error);
            response.status(500).json({ error: 'Erro interno ao inserir agendamento.' });
        }
    }

    // Editar agendamentos
    app.put('/agendamento/:id', editar)
    async function editar(req, res) {
        const idAgendamento = req.params.id;
        try {
            console.log("ID do Agendamento:", idAgendamento);
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            })
            const idEmpresa = req.session.loggedUser.id_empresa;
            const { nome, dia, mes, hora, minuto } = req.body

            const { id_empresa } = await db.get('SELECT id_empresa FROM clienteEmpresa WHERE id_empresa = ?', idEmpresa);

            await db.run('UPDATE agendamento SET nome = ?, dia = ?, mes = ?, hora = ?, minuto = ? WHERE id_agendamento = ? AND id_empresa = ?', nome, dia, mes, hora, minuto, idAgendamento, id_empresa);

            console.log("Agendamento editado com sucesso");
            console.log("Agendamento " + req.body.nome + " " + "trocado com sucesso")
            res.status(200).json({ Mensagem: "Agendamento " + req.session.loggedUser.user + " " + "trocado com sucesso" })
            db.close();
        } catch (error) {
            console.error('Erro ao inserir agendamento:', error);
            res.status(500).json({ error: 'Erro interno ao inserir agendamento.' });
        }
    }
    // Rota para o cliente fazer uma reserva
    app.post('/reservar', async (req, res) => {
        const idAgendamento = req.body.idAgendamento;
        const idUsuario = req.body.idUsuario;

        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database,
            });

            // Verificar se o horário está disponível para reserva
            const horarioDisponivel = await verificarDisponibilidade(db, idAgendamento);

            if (horarioDisponivel) {
                // Atualizar o agendamento para marcado como reservado pelo cliente
                await db.run('UPDATE agendamento SET status_reserva = 1, id_usuario = ? WHERE id_agendamento = ?', idUsuario, idAgendamento);
                res.json({ success: true, message: 'Reserva efetuada com sucesso.' });
            } else {
                res.json({ success: false, error: 'Horário não disponível. Escolha outro horário.' });
            }

            db.close();
        } catch (error) {
            console.error('Erro ao fazer reserva:', error);
            res.status(500).json({ success: false, error: 'Erro interno ao fazer reserva.' });
        }
    })

    // Rota para a empresa negar a reserva
    app.put('/reserva/negada', async (req, res) => {
        const idAgendamento = req.body.idAgendamento;

        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database,
            });

            // Verificar se o horário está disponível para reserva
            const horarioDisponivel = await verificarDisponibilidade(db, idAgendamento);

            if (horarioDisponivel) {
                // Atualizar o agendamento para marcado como reservado pelo cliente
                await db.run('UPDATE agendamento SET status_reserva = 0 WHERE id_agendamento = ?', idAgendamento)

                res.json({ success: true, message: 'Negado a reserva com sucesso.' });
            } else {
                res.json({ success: false, error: 'Horário não disponível. Escolha outro horário.' });
            }

            await db.close();
        } catch (error) {
            console.error('Erro ao fazer reserva:', error);
            res.status(500).json({ success: false, error: 'Erro interno ao fazer reserva.' });
        }
    })
    app.get('/reserva/negada', async (req, res) => {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database,
            });
            const enviar = await db.get('SELECT * FROM agendamento')
            res.status(200).json({ mensagem: "foi negado a sua reserva", notificacao: enviar })
            await db.close();
        } catch (error) {
            console.error('Erro ao fazer reserva:', error);
            res.status(500).json({ success: false, error: 'Erro interno ao fazer reserva.' });
        }
    })

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
    // Causa o usuario queira colocar mais de uma foto
    // const upload = multer({ storage })
    // const maxFotos = 3;

    // app.post('/uploads', upload.array('imagem', maxFotos), (req, res) => {
    //     const imagem = req.file;
    //     res.json({ imagePath: '/uploads/' + imagem.filename });
    // });

    // Rota para receber os uploads de imagens
    app.post('/uploads', upload.single('imagem'), async (req, res) => {
        const imagemPerfil = req.file ? req.file.path : null
        // A imagem está disponível em req.file
        const imagem = req.file;
        //   const extensao = path.extname(imagem.originalname);
        console.log('Imagem recebida:', imagem);
        // const db = await open({
        //     filename: './lib/gt.db',
        //     driver: sqlite3.Database
        // });
        // await db.run('INSERT INTO clienteEmpresa (imagemPerfil) VALUES (?), ',imagem)

        // Envie uma resposta para o cliente
        // res.json({ imagePath: '/uploads/' + imagem.filename });
        res.json({ imagePath: imagemPerfil })

    })
    // Rota para receber os uploads de imagens do cliente
    app.post('/uploadsClientes', upload.single('imagem'), async (req, res) => {
        const imagemPerfil = req.file ? req.file.path : null
        const imagem = req.file;
        console.log('Imagem recebida:', imagem);
        res.json({ imagePath: imagemPerfil })
    })

}
export default agendamento