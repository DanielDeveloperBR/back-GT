import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt'
import multer from 'multer';
import path from 'path';

// async function verificarDisponibilidade(db, idAgendamento) {

//     const count = await db.get(`
//         SELECT COUNT(*) as count
//         FROM agendamento
//         WHERE id_agendamento = ? AND status_reserva = 0
//     `, idAgendamento);

//     return count.count > 0;
// }
function clienteControl(app) {
    app.get('/api/salas', (req, res) => {
        // Lógica para obter a lista de salas disponíveis do seu banco de dados ou onde preferir
    
        // Suponha que você tenha uma lista de salas disponíveis
        const salasDisponiveis = [
          { id: 'sala1', nome: 'Sala 1' },
          { id: 'sala2', nome: 'Sala 2' },
          // ... outras salas
        ];
    
        res.status(200).json(salasDisponiveis);
      });
    // Filtrar e só aceita essas extensoes
    const fileFilter = (req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png']
        if (!allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) {
            return cb(new Error('Apenas imagens com .jpg, .jpeg, ou .png .'))
        }
        cb(null, true);
    };
    // Fazendo a conversão para salvar a imagem com a extensão
    const storage = multer.diskStorage({
        destination: 'uploadsClientes/',
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    })
    // Limite máximo do tamanho dos arquivos
    const limits = { fileSize: 1024 * 1024 * 50 }
    // const upload = multer({ storage: storage })
    const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
    });
    // Rota para receber os uploads de imagens do cliente
    app.post('/uploadsClientes', upload.single('imagem'), async (req, res) => {
        const imagemPerfil = req.file ? req.file.path : null
        const imagem = req.file;
        console.log('Imagem recebida:', imagem);
        res.json({ imagePath: imagemPerfil })
    })
   
    // cadastrar um novo usuario
    app.post('/usuario', upload.single('imagemPerfil'), inserir)
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
                await db.run(`INSERT INTO clienteUsuario (nome,senha,email,cep,bairro,cidade, endereco,estado, imagemPerfil) VALUES (?,?,?,?,?,?,?,?,?)`, request.body.nome, senhaCriptografada, request.body.email, request.body.cep, request.body.bairro, request.body.cidade, request.body.endereco, request.body.estado, imagemPerfil)
                response.send(`Usuario: ${request.body.nome} inserido com sucesso.`);
                db.close();
            } catch (error) {
                console.error('Erro:', error);
                response.status(500).send('Erro interno no servidor.');
            }
        })()
    }
}
export default clienteControl