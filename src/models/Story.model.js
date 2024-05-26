import mongoose, { Schema } from "mongoose";

const storySchema = new Schema({
    user : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
    media : String,
    views : [{
        type : Schema.Types.ObjectId,
        ref : 'User',
    }],
    createdAt : {
        type : Date,
        default : Date.now
    },
    expiresAt : {
        expiresAt : Date
    }
})

export const Story = mongoose.model("Story", storySchema)