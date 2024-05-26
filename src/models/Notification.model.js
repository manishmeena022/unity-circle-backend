import mongoose,{Schema} from "mongoose";

const notificatioSchema = new Schema({
    user : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
    type : String,
    content : String,
    read : {
        type : Boolean,
        default : false,
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

export const Notification = mongoose.model('Notification', notificatioSchema);