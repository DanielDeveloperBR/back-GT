import express from 'express'
import tarefasControl from './control/tarefasControl.js'
import usuarioControl from './control/usuarioControl.js'
import rootControl from './control/rootControl.js'
import cors from 'cors'
const app = express()
app.use((req,res,next)=>{
  res.header("Access-Control-Allow-Origin","*")
  res.header("Access-Control-Allow-Methods","GET,PUT,POST,DELETE")
  res.header("Access-Control-Allow-Headers","X-PINGOTHER,Content-Type, Authorization")
  app.use(cors())
  next()
})
app.use(express.json())
tarefasControl(app)
usuarioControl(app)
rootControl(app)
export default app