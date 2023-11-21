import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import usuarioControl from './control/usuarioControl.js';
import rootControl from './control/rootControl.js';
import empresaControl from './control/empresaControl.js';
import clienteControl from './control/clienteControl.js';
import agendamento from './control/agendamento.js';
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express()
app.use(express.static(path.join(__dirname, 'views')));

app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
  allowedHeaders: 'Content-Type, Authorization',
}));

app.use(express.static(path.join(__dirname, '../Projeto-ReservaNaLoja-Daniel')))
app.use('/doc', express.static(path.join(__dirname, './control')))


// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
//   res.header("Access-Control-Allow-Headers", "X-PINGOTHER,Content-Type, Authorization");
//   next();
// })

app.use(express.json());

usuarioControl(app);
rootControl(app);
empresaControl(app)
clienteControl(app)
agendamento(app)

export default app;
