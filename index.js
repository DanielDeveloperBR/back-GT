import { app, wss, server } from './app.js';

const port = 3000;

server.listen(port, () => {
  console.log(`Servidor em: http://localhost:${port}`);
})