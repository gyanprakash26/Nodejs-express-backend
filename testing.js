const moongose = require("mongoose")
// app.js 

const express = require('express')

const app = express()
app.get("/",(req,res)=>{
    res.send("success")
})
app.listen(8000)
const dbConnection = async()=>{
    try {
        await moongose.connect("mongodb://localhost:27017/hujjjjj")
        console.log(`Mongodb connect successfull`)
    } catch (error) {
        throw new Error("MongoDB Connection failed")
    }    
}
dbConnection()
