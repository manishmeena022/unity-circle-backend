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

        const avatarLocalPath = req.file?.avatar[0]?.path;

        if(!avatarLocalPath){
            throw new ApiError(400, "Avatar is required")
        }
        
        const avatar = await uploadCloudinary(avatarLocalPath);

        if(!avatar){
            throw new ApiError(400,"Avatar file is required")
        }
    
        const user = await User.create({
            fullName,
            avatar : avatar.url,
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

const profile = asyncHandler(async (req, res) => {
    try{
        const user = await User.findById(req.user._id);

        const options = {
            username : user.username,
            profile : user.profile,
            fullName : user.fullName,
            email : user.email,
            avatar : user.avatar,
            createdAt : user.createdAt,
        }
         return res
            .status(200)
            .json(new ApiResponse(200, options, "User profile fetched successfully"))
    }catch(error){
        throw new ApiError(500, "Something went wrong while fetching user profile")
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

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if(!incommingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }
    try{
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        if(!decodedToken){
            throw new ApiError(401, "Invalid refresh token")
        }

        const user = await User.findById(decodedToken._id);

        if(!user){
            throw new ApiError(404, "User not found")
        }

        if(user?.refreshToken !== incommingRefreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly : true,
            secure : true,
        }

        const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(
                200, 
                {accessToken, refreshToken : newRefreshToken},
                "Access token refreshed successfully"
            )
        )
    }catch(error){
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    try{
        const {currentPassword, newPassword} = req.body;

        if(!currentPassword || !newPassword){
            throw new ApiError(400, "Current and new password are required")
        }

        const user = await User.findById(req.user?._id);

        const isPasswordValid = await req.user.isPasswordValid(currentPassword);

        if(!isPasswordValid){
            throw new ApiError(401, "Invalid current password")
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave : false });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password changed successfully"))
    }catch(error){
        throw new ApiError(500, "Something went wrong while changing password")
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    try{
        return res
                .status(200)
                .json(new ApiResponse(200, req.user, "User fetched successfully"))
    }catch(error){
        throw new ApiError(500, "Something went wrong while fetching user")
    }
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400, "Full name and email are required")
    }
    try{
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set : {
                    fullName,
                    email
                }
            },
            {new : true}
        ).select("-password")

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Account details updated successfully"))
    }catch(error){
        throw new ApiError(500, "Something went wrong while updating account details")
    }
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    try{
        const avatar = await uploadCloudinary(avatarLocalPath);

        if(!avatar.url){
            throw new ApiError(400, "Avatar file is required")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set : {
                    avatar : avatar.url
                }
            },
            {new : true}
        ).select("-password")

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Avatar updated successfully"))
    }catch(error){
        throw new ApiError(500, "Something went wrong while updating avatar")
    }
})


export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, profile}