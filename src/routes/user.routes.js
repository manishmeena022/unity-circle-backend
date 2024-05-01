import { Router } from "express";
import { registerUser, loginUser, refreshAccessToken, changeCurrentPassword, profile, updateAccountDetails, updateUserAvatar,  } from "../controllers/user.controller";

const router = Router();

router.route("/register").post(upload.fields([ { name : "avatar", maxCount : 1 } ]), registerUser);
router.route("/login").post(verifyJWT, loginUser);
router.route("/logout").post(refreshAccessToken);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/profile").get(verifyJWT, profile);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);


export default router;

