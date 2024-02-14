import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './routes/user.route.js'

const app = express()
app.use(cors({
    origin:process.env.CORS_ORIGIN
})) // allow cors for specific origin
app.use(express.json({limit:'16kb'})) // yeh middleware json data ko allow krta hai request or response mai
app.use(express.urlencoded({extended:true,limit:"24kb"})) //Returns middleware that only parses urlencoded bodies and only looks at requests where the Content-Type header matches the type option hum url mai dhekte hai %20 and + to use filter out krta hai
app.use(express.static("public")) /// jab hum koi file ya pic upload krte hai to voh humare server par hi save ho jese public folder mai hoga yha
app.use(cookieParser())

// import routes

app.use("/api/v1/users",router)

export default app