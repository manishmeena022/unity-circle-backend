import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
//import { upload } from "../middlewares/multer.middleware.js";
// import path from "path";
// const AVATAR_PATH = path.join("/public/uploads/users/avatars");

const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unqiue : true,
        lowercase : true,
        trim : true,
    },
    fullName : {
        type : String,
        required : true,
        trim : true,
    },
    email : {
        type : String,
        required : true,
        unique : true,
        // match : /^\S+@\S+\. \S+$/,
    },
    password : {
        type : String,
        required : true,
    },
    bio : {
        type : String,
    },
    profilePicture : {
        type : String,
    //    required : true,
    },
    coverPhoto : {
        type : String,
    },
    phone : {
        type : String,
    },
    birthData : {
        type : String,
    },
    gender : {
        type : String,
    },
    location : {
        type : String,
    },
    interests : [{
        type : String,
    }],
    followers : [{
        type : Schema.Types.ObjectId,
        ref : 'User'
    }],
    following : [{
        type : Schema.Types.ObjectId,
        ref : 'User'
    }],
    posts : [{
        type : Schema.Types.ObjectId,
        ref : 'Post'
    }],
    story : [{
        type : Schema.Types.ObjectId,
        ref : 'Story'
    }],
    refreshToken : {
        type : String,
    },
    createdAt : {
        type : Date,
        default : Date.now
    },
    updatedAt : {
        type : Date,
        default : Date.now
    }
})


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Define the instance method to compare passwords
userSchema.methods.isPasswordCorrect = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        console.error("Error comparing password", error);
        return false;
    }
};


userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id : this._id,
        username : this.username,
        email : this.email,
        fullName : this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    })
}

// userSchema.statics.uploadedAvatar = upload.single("avatar");

// userSchema.statics.avatarPath = AVATAR_PATH;

export const User = mongoose.model("User", userSchema);