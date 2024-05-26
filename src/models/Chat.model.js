import mongoose,{Schema} from "mongoose";

const chatSchema = new Schema({
    participants : [{
        type : Schema.Types.ObjectId,
        ref : 'User',
    }],
    messages : [{
        sender : {
            type : Schema.Types.ObjectId,
            ref : 'User',
        },
        message : {
            type : String,
        },
        timestamp : {
            type : Date,
            default : Date.now
        }
    }],
    createdAt : {
        type : Date,
        default : Date.now
    },
    updatedAt : {
        type : Date,
        default : Date.now
    }
})

export const Chat = mongoose.model("Chat", chatSchema);