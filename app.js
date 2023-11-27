// app.js

import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import usuarioControl from './control/usuarioControl.js';
import rootControl from './control/rootControl.js';
import empresaControl from './control/empresaControl.js';
import clienteControl from './control/clienteControl.js';
import agendamento from './control/agendamento.js';
import appControl from './control/appControl.js';
import cors from 'cors';
// import bodyParser from 'body-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, cors: { origin: '*' } });
app.use(express.static(path.join(__dirname, 'views')));
app.use('/uploads', express.static('uploads'));
app.use('/uploadsClientes', express.static('uploadsClientes'));
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
  allowedHeaders: 'Content-Type, Authorization',
}));
// app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, '../Projeto-ReservaNaLoja-Daniel')));
app.use('/doc', express.static(path.join(__dirname, './control')));

usuarioControl(app);
rootControl(app);
empresaControl(app, wss);
clienteControl(app, wss);
agendamento(app, wss);
appControl(app);

export { app, wss, server };
