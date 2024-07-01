import { Router } from "express";
import { registerUser, loginUser, refreshAccessToken, changeCurrentPassword, profile, updateAccountDetails, updateUserAvatar, getCurrentUser, followUser, unfollowUser,  } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.fields([ { name : "profilePicture", maxCount : 1 } ]), registerUser);
router.route("/login").post( loginUser);
router.route("/logout").post(verifyJWT, refreshAccessToken);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/profile").get(verifyJWT, profile);
//router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/user/:userId/follow").post(followUser);
router.route("/user/:userId/unfollow").post(unfollowUser);

export default router;

