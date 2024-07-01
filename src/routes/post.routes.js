import { Router } from "express";
import { commentsOnPost, createPost, deletePost, getAllPosts, getSinglePost, likePost, updatePost } from "../controllers/posts.controller.js";

const router = Router();

router.route("/createPost").post(createPost);
//router.route("/createPost").post(upload.array('media', 10), createPost);
router.route('/posts').get(getAllPosts);
router.route('/post/:id').get(getSinglePost);
router.route('/post/:id').put(updatePost);
router.route('/post/:id').delete(deletePost);
router.route('/post/:id/like').post(likePost);
router.route('/post/:id/comment').post(commentsOnPost);

export default router;