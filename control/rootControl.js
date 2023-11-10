import path from "path";

function rootControl(app) {
    app.get("/", exibir);

    function exibir(req, res) {
        const filePath = path.join(__dirname, "../Projeto-ReservaNaLoja-Daniel/");
        res.sendFile(filePath);
    }
}

export default rootControl;
