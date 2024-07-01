import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import uploadCloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName, phone, gender } = req.body;
    // const { profilePicture } = req.files;

    console.log('email', email, 'password', password, 'username', username, 'fullName', fullName, "gender", gender, "phone", phone)

    // Check if any required field is empty or whitespace
    if ([fullName, email, password, username, phone, gender].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    try {
        // Check if user with the provided email or username already exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });

        if (userExists) {
            throw new ApiError(400, "User already exists");
        }

        //Check if avatar is provided
        // if (!req.files || !req.files.profilePicture || req.files.profilePicture.length === 0) {
        //     throw new ApiError(400, "Profile Picture is required");
        // }

        // const avatarLocalPath = req.files.profilePicture[0].path;
    
        // console.log("avatarLocalPath", avatarLocalPath)
        // // Upload avatar to Cloudinary
        // const avatar = await uploadCloudinary(avatarLocalPath);

        // console.log("avatar", avatar)

        // if (!avatar || !avatar.url) {
        //     throw new ApiError(400, "Avatar upload failed");
        // }

        // Create new user
        const newUser = await User.create({
            fullName,
        //   profilePicture: avatar.url,
            email,
            password,
            username: username.toLowerCase(),
            gender,
            phone,
        });

        // Find the created user and exclude sensitive fields
        const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new ApiError(500, "User creation failed");
        }

        // Return success response
        return res.status(201).json(new ApiResponse(200, createdUser, "User created successfully"));
    } catch (error) {
        console.log("error", error);
        throw new ApiError(500, "User registration failed", error);
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;
    console.log("email", email, "password", password, "username", username)
    if (!email && !password) {
        throw new ApiError(400, "Username, email, and password are required");
    }
    try {
        const user = await User.findOne({
            $or: [{ username }, { email }]
        }).populate("posts");

        console.log("user", user)

        if (!user) {
            throw new ApiError(404, "User does not exist");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        console.log("isPasswordValid", isPasswordValid)

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials");
        }

        const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            // Only set secure cookies in a secure environment
            secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
        };

        // No need to query user again, loggedInUser is already fetched
        const loggedInUser = { ...user._doc, password: undefined, refreshToken: undefined };
        

        return res 
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
    } catch (error) {
        // Handle errors within the catch block
        return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message || "Something went wrong while logging in user"));
    }
});

const profile = asyncHandler(async (req, res) => {  
    try {
        const user = await User.findById(req.user._id);

        const options = {
            username: user.username,
            profile: user.profile,
            fullName: user.fullName,
            email: user.email,
            gender : user.gender,
            phone : user.phone,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
        }
        return res
            .status(200)
            .json(new ApiResponse(200, options, "User profile fetched successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching user profile")
    }
})

export const followUser = asyncHandler(async (req, res) => {
    const { userIdToFollow } = req.body;
    const { userId } = req.params;

    if (!userIdToFollow) {
        throw new ApiError(400, "User Id to follow is required");
    }

    if (!mongoose.Types.ObjectId.isValid(userIdToFollow)) {
        throw new ApiError(400, "Invalid User Id to follow");
    }

    if(!userId){
        throw new ApiError(400, 'User Id is required to follow a user');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User Id");
    }

    try{
        const userToFollow = await User.findById(userIdToFollow);
        const currentUser = await User.findById(userId);

        if (!userToFollow) {
            throw new ApiError(404, "User to follow not found");
        }

        if (!currentUser) {
            throw new ApiError(404, "User not found");
        }

        if (currentUser.following.includes(userIdToFollow)) {
            throw new ApiError(400, "User already followed");
        }

        currentUser.following.push(userIdToFollow);
        userToFollow.followers.push(userId);
        await currentUser.save();
        await userToFollow.save();

        return res.status(200).json(new ApiResponse(200, currentUser, "User followed successfully"));
    }catch(error){
        throw new ApiError(500, "Internal Server Error", error.message)
    }
});

export const unfollowUser = asyncHandler(async (req, res) => {
    const { userIdToUnfollow } = req.body;
    const { userId } = req.params;

    if (!userIdToUnfollow) {
        throw new ApiError(400, "User Id to unfollow is required");
    }

    if (!mongoose.Types.ObjectId.isValid(userIdToUnfollow)) {
        throw new ApiError(400, "Invalid User Id to unfollow");
    }

    if(!userId){
        throw new ApiError(400, 'User Id is required to unfollow a user');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User Id");
    }

    try{
        const userToUnfollow = await User.findById(userIdToUnfollow);
        const currentUser = await User.findById(userId);

        if (!userToUnfollow) {
            throw new ApiError(404, "User to unfollow not found");
        }

        if (!currentUser) {
            throw new ApiError(404, "User not found");
        }   

        if (!currentUser.following.includes(userIdToUnfollow)) {
            throw new ApiError(400, "User not followed");
        }

        currentUser.following = currentUser.following.filter((id) => id !== userIdToUnfollow);
        userToUnfollow.followers = userToUnfollow.followers.filter((id) => id !== userId);
        await currentUser.save();
        await userToUnfollow.save();

        return res.status(200).json(new ApiResponse(200, currentUser, "User unfollowed successfully"));
        
    }catch(error){
        throw new ApiError(500, "Internal Server Error", error.message)
    }
})

const logoutUser = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1
                }
            }, {
            new: true
        }
        )

        const options = {
            httpOnly: true,
            secure: true,
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully"))

    } catch (error) {
        throw new ApiError(500, "Something went wrong while logging out user")
    }
})

const deleteUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            throw new ApiError(400, 'User not found');
        }

        return res.status(200).json(new ApiResponse(200, 'User Deleted Successfully'))
    } catch (error) {
        throw new ApiError(500, 'Failed to delete  User', error)
    }
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incommingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

        if (!incommingRefreshToken) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        if (!decodedToken) {
            throw new ApiError(401, "Invalid refresh token")
        }

        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        if (user?.refreshToken !== incommingRefreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access token refreshed successfully"
            )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        //console.log(req.body)

        if (!(currentPassword || newPassword)) {
            throw new ApiError(400, "Current and new password are required")
        }

        const user = await User.findById(req.user?._id);

        //console.log(user)   

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        const isPasswordValid = await user.isPasswordCorrect(currentPassword);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid current password")
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password changed successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while changing password", error)
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        return res
            .status(200)
            .json(new ApiResponse(200, req.user, "User fetched successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching user")
    }
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "Full name and email are required")
    }
    try {
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName,
                    email
                }
            },
            { new: true }
        ).select("-password")

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Account details updated successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while updating account details")
    }
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    try {
        const avatar = await uploadCloudinary(avatarLocalPath);

        if (!avatar.url) {
            throw new ApiError(400, "Avatar file is required")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            { new: true }
        ).select("-password")

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Avatar updated successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while updating avatar")
    }
})


export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, profile, deleteUser }