import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function rootControl(app) {
    app.get("/", exibir);

    function exibir(req, res) {
        const filePath = path.join(__dirname, "../frontExpress/");
        res.sendFile(filePath);
    }

    app.get("/doc", exibirDoc)
    function exibirDoc(req, res) {
        const filePath = path.join(__dirname, "documentacao.html")
        console.log(filePath)
        res.sendFile(filePath)
    }
}
export default rootControl;