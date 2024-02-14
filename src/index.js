// require('dotenv').config({path: './env'})  // so it break our consisten like import we use import so add some script in package.json
import dotenv from "dotenv"; /// script  -r dotenv/config --experimental-json-modules
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({ path: "./env" }); //  it is used to load env varible to our whole application
connectDB() //// it return promises so solve this using them and catch
  .then(() => {
    app.on("Connection error ",(err)=>{
        console.log("ERROR :",err)
        throw err
    })
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Mongodb connect error ", err);
  });

/*
import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_DB}/${DB_NAME}`);
    app.on("Error", (error) => { /////// it app.on is a expres func used trigger an event and find express with mongose connect
      console.error("ERROR :", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`App is running on ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("ERROR :", error);
    throw error;
  }
})();
*/
