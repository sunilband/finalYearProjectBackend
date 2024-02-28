import { Router } from "express";
import {
  sendPhoneOTP,
  sendEmailOTP,
  verifyOTP,
  registerDoner,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeUserpassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatarAndOrCover,
} from "../controllers/doner.controller.js";
// import { upload } from "../middlewares/multer.middleware.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/ratelimiter.middleware.js";

const router = Router();

router.route("/send-phone-otp").post(rateLimit(50), sendPhoneOTP);
router.route("/send-email-otp").post(rateLimit(50), sendEmailOTP);
router.route("/verify-otp").post(rateLimit(50), verifyOTP);
router.route("/register-doner").post(rateLimit(50), registerDoner);

// router.route("/login").post(rateLimit(3), loginUser);

// router.route("/refresh-token").get(rateLimit(1), refreshAccessToken);

// // secured routes (user must have token)
// router.route("/logout").get(rateLimit(1), verifyJWT, logoutUser);

// router
//   .route("/change-password")
//   .put(rateLimit(1), verifyJWT, changeUserpassword);

// router.route("/get-user").get(rateLimit(1), verifyJWT, getCurrentUser);

// router
//   .route("/update-account")
//   .put(rateLimit(1), verifyJWT, updateAccountDetails);

// router.route("/update-avatar-cover").put(
//   rateLimit(1),
//   verifyJWT,
//   upload.fields([
//     { name: "avatar", maxCount: 1 },
//     { name: "coverImage", maxCount: 1 },
//   ]),
//   updateAvatarAndOrCover
// );

export default router;
