import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import usuarioControl from './control/usuarioControl.js';
import rootControl from './control/rootControl.js';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

app.use(express.static(path.join(__dirname, '../Projeto-ReservaNaLoja-Daniel')));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "X-PINGOTHER,Content-Type, Authorization");
  app.use(cors());
  next();
});

app.use(express.json());

usuarioControl(app);
rootControl(app);

export default app;
