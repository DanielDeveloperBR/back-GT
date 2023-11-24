import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import usuarioControl from './control/usuarioControl.js';
import rootControl from './control/rootControl.js';
import empresaControl from './control/empresaControl.js';
import clienteControl from './control/clienteControl.js';
import agendamento from './control/agendamento.js';
import appControl from './control/appControl.js';
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.use(cors());


app.use(express.static(path.join(__dirname, '../Projeto-ReservaNaLoja-Daniel')))
app.use('/doc', express.static(path.join(__dirname, './control')))


app.use(express.json());

usuarioControl(app);
rootControl(app);
empresaControl(app)
clienteControl(app)
agendamento(app)
appControl(app)

export default app;
