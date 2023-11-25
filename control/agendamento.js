import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import multer from 'multer';
import path from 'path';
function agendamento(app) {
    // Exibir o dia, mês hora e minuto do agendamento
    // app.get('/agendamento', exibir)
    // function exibir(request, response) {
    //     (async () => {
    //         const db = await open({
    //             filename: './lib/gt.db',
    //             driver: sqlite3.Database
    //         })
    //         const result = await db.all('SELECT dia,mes,hora,hora,minuto FROM agendamento')
    //         response.send(result)
    //         db.close()
    //     })()
    // }
    app.get('/agendamentos', obterAgendamentos);
    async function obterAgendamentos(req, res) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            });
            // const idUsuario = req.session.loggedUser.id_usuario;
            const agendamentos = await db.all(`SELECT a.*, ce.nome AS nome_empresa FROM agendamento a JOIN clienteEmpresa ce ON a.id_empresa = ce.id_empresa`)
            res.json(agendamentos);
            db.close();
        } catch (error) {
            console.error('Erro ao obter agendamentos:', error);
            res.status(500).json({ error: 'Erro interno ao obter agendamentos.' });
        }
    }

   

    // Agendamento
    app.post('/agendamento', inserir);
    async function inserir(request, response) {
        try {
            const db = await open({
                filename: './lib/gt.db',
                driver: sqlite3.Database
            });
            const idEmpresa = request.session.loggedUser.id_empresa;
            const { nome, dia, mes, hora, minuto } = request.body;

            await db.run('INSERT INTO agendamento (nome, dia, mes, hora, minuto, id_empresa) VALUES (?, ?, ?, ?, ?, (SELECT id_empresa FROM clienteEmpresa WHERE id_empresa = ?))', nome, dia, mes, hora, minuto, idEmpresa);

            response.send(`Agendamento: ${nome} inserido com sucesso.`);
            db.close();
        } catch (error) {
            console.error('Erro ao inserir agendamento:', error);
            response.status(500).json({ error: 'Erro interno ao inserir agendamento.' });
        }
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

    // Causa o usuario queira colocar mais de uma foto
    // const upload = multer({ storage })
    // const maxFotos = 3;

    // app.post('/uploads', upload.array('imagem', maxFotos), (req, res) => {
    //     const imagem = req.file;
    //     res.json({ imagePath: '/uploads/' + imagem.filename });
    // });

    // Rota para receber os uploads de imagens
    app.post('/uploads', upload.single('imagem'), async (req, res) => {
        const imagemPerfil = request.file ? request.file.path : null
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
        res.json({imagePath: imagemPerfil})

    })

}
export default agendamento