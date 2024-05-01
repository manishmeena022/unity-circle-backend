import mongoose,{Schema} from "mongoose";

const postSchema = new Schema({
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
    user : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },
    comments : [
        {
            type : Schema.Types.ObjectId,
            ref : "Comment",
        }
    ],
    likes : [   
        {
            type : Schema.Types.ObjectId,
            ref : "Like",
        }
    ]
},{
    timestamps : true
})

export const Post = mongoose.model("Post", postSchema);