import path from "path"
function rootControl(app) {
    app.get("/", exibir)
    function exibir(req,res){
        res.sendFile(path.join(path.resolve(), "./control/documentacao.html"))
    }
}

export default rootControl