import mongoose,{Schema} from "mongoose";

const postSchema = new Schema({
    user : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
    title : {
        type : String,
        required : true,
    },
    content : {
        type : String,
        required : true,
    },
    image : {
        type : String,
        //required : true,
    },
    video : {
        type : String,
        //required : true,
    },
    likes : [{
        type : Schema.Types.ObjectId,
        ref : 'User'
    }],
    comments : [{
        user : {
            type : Schema.Types.ObjectId,
            ref : 'User'
        },
        text : {
            type : String,
        },
        createdAt : {
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

export const Post = mongoose.model("Post", postSchema);