import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId);

        if(!user){
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAcessToken()
        const refreshToken = user.generateAcessToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave : false });

        return {accessToken, refreshToken}

        
    } catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;
    //console.log('email', email)
    try{
        if([fullName, email, password, username].some((field) => field?.trim() === "")){
            throw new ApiError(400, "All fields are required")
        }
    
        const userExists = await User.findOne({ 
            $or : [
                {email},
                {username}
            ]
        })
    
        if(userExists){
            throw new ApiError(400, "User already exists")
        }
    
    
        const user = await User.create({
            fullName,
            // avatar = avatar.url,
            email,
            password,
            username : username.toLowerCase(),
        })
    
        const createdUser = await User.findById(user._id).select("-password -refreshToken");
    
    
        if(!createdUser){
            throw new ApiError(500, "Something went wrong while creating user")
        }
    
        return res.status(201).json(new ApiResponse(201, createdUser, "User created successfully"))
    }catch(error){
        throw new ApiError(500, "Something went wrong while registering user")
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const {email, password, username} = req.body;
    try{
        if(!username && !email){
            throw new ApiError(400,"Username or email is required")
        }

        const user = await User.findOne({
            $or : [
                {email},
                {username}
            ]
        })

        if(!user){
            throw new ApiError(404, "User does not exist")
        }

        const isPasswordValid = await user.isPasswordValid(password);

        if(!isPasswordValid){
            throw new ApiError(401, "Invalid credentials")
        }

        const {accessToken, refreshToken} = await user.generateAccessTokenAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly : true,
            secure : true,
        }

        return res  
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { user : loggedInUser, accessToken, refreshToken }, "User logged in successfully"))

    }catch(error){
        throw new ApiError(500, "Something went wrong while logging in user")
    }

})

const logoutUser = asyncHandler(async (req, res) => {
    try{
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset : {
                    refreshToken : 1
                }
            },{
                new : true
            }
        )

        const options = {
            httpOnly : true,
            secure : true,
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully"))
        
    }catch(error){
        throw new ApiError(500, "Something went wrong while logging out user")
    }
})