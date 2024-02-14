import mongoose, { Schema } from "mongoose";

const subscriptionSchema = mongoose.Schema(
    {
        subscription:{
            type : mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        channel:{
            type : mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    },{
        timestamps:true
    }
)

// export default subscriptionSchema
export {subscriptionSchema}
