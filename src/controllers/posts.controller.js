import { Post } from "../models/post.model.js";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createPost = asyncHandler(async (req, res) => {
    const { user, title, content } = req.body;

    if(!user || !title || !content){
        throw new ApiError(400, "All fields are required");
    }

    try{
        const existingUser = await User.findById(user);

        if(!existingUser){
            throw new ApiError(404, "User not found");
        }

        let images = [];
        let videos = [];

        /*

        if(req.files){
            for(let file of req.files){
                console.log("file", file);
                if(file.mimetype.startWith('images')){
                    images.push(file.path);
                }else if(file.mimetype.startWith('videos')){
                    videos.push(file.path);
                }
            }
        }
        */  

        const newPost = new Post({
            user,
            title,
            content,
            // images,
            // videos,
        });

        let savedPost = await newPost.save();

        existingUser.posts.push(savedPost._id);

        await existingUser.save();

        savedPost = await savedPost
                        .populate('user', 'username fullName profilePicture')

        return res.status(201).json(new ApiResponse(200, savedPost, "Post created successfully"));

    }catch(error){
        console.log("error", error);
        throw new ApiError(500, "Failed to create post", error);
    }
})

export const getAllPosts = asyncHandler(async (req, res) => {
    try{
        const posts = await Post.find()
            .populate('user', 'username fullName profilePicture')
            // .populate('likes')
            .populate('comments.user', 'username fullName profilePicture')
            .sort({ createdAt : -1 });

        return res.status(200).json(new ApiResponse(200, posts, "All Posts"))
    }catch(error){
        throw new ApiError(500, "Failed to get all posts ", error);
    }
})

export const getSinglePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try{    
        const post = await Post.findById(id).populate('user').populate('likes').populate('comments.user');
        if(!post){
            throw new ApiError(404, 'Post not found');
        }

        return res.status(200).json(new ApiResponse(200, post, 'post'));

    }catch(error){
        throw new ApiError(500, 'Failed to get post', error)
    }
})

export const updatePost = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const { title, content } = req.body;

    if(!title && !content){
        throw new ApiError(400, "At least one field must be provided to update!")
    }

    try{
        const existingPost = await Post.findById(id);

        if(!existingPost){
            throw new ApiError(404, 'Post not found');
        }

        // Update the post
        if (title) existingPost.title = title;
        if (content) existingPost.content = content;
        // if (image) existingPost.image = image;
        // if (video) existingPost.video = video;
        existingPost.updatedAt = Date.now();

        const updatedPost = await existingPost.save();

        return res.status(200).json(new ApiResponse(200, updatedPost, "Post updated Successfully"))

    }catch(error){
        throw new ApiError(500, 'Internal server error'. error);
    }
})

export const deletePost = asyncHandler(async (req, res ) =>{
    const { id } = req.params;

    try{
        const deletedPost = await Post.findByIdAndDelete(id);

        if(!deletedPost){
            throw new ApiError(404, 'Post not found');
        }

        res.status(200).json(new ApiResponse(200, "Post deleted Successfully"))
    }catch(error){
        throw new ApiError(500, 'Internal Server Error', error);
    }
})

export const likePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if(!userId){
        throw new ApiError(400, 'User Id is required to like a post');
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400, 'Invalid User Id');
    }

    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(400, 'Invalid Post Id');
    }

    try{
        const post = await Post.findById(id);

        if(!post){
            throw new ApiError(404, 'Post not found');
        }

        const updatedPost = await Post.findByIdAndUpdate(id, {
            $addToSet : { likes : new mongoose.Types.ObjectId(userId) }
        }, { new : true })
        .populate('user', 'username fullName profilePicture')
        //.populate('likes').populate('comments.user');

         return res.status(200).json(new ApiResponse(200, updatedPost, "likes on post"))
    }catch(error){
        console.log('error', error)
        throw new ApiError(500, 'Internal Server Error', error.message)
    }
})

export const commentsOnPost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId, text } = req.body;

    if(!userId || !text){
        throw new ApiError(400, 'User Id and text is required to comment on a post');
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400, 'Invalid User Id');
    }

    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(400, 'Invalid Post Id');
    }

    try{
        const post = await Post.findById(id);

        if(!post){
            throw new ApiError(404, 'Post not found');
        }

        const newComment = {
            user : new mongoose.Types.ObjectId(userId),
            text,
            createdAt : Date.now()
        }

        post.comments.push(newComment);
        await post.save();

        const populatedPost = await Post.findById(id).populate('comments.user', 'username fullName profilePicture');

        return res.status(200).json(new ApiResponse(200, populatedPost, 'comment on Post'));
    }catch(error){
        console.log('error', error)
        throw new ApiError(500, 'Internal Server Error', error)
    }
})