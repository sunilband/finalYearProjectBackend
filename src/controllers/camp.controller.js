import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../constants.js";
import { BloodBank } from "../models/bloodBank.model.js";
import { Otp } from "../models/otp.model.js";
import { sendMail } from "../utils/mailService.js";
import { DonationCamp } from "../models/donationCamp.model.js";

const sendEmailVerifyOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Please provide a email ");
  } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email ");
  }

  const existingUser = await BloodBank.findOne({ email, emailVerified: true });

  if (existingUser) {
    throw new ApiError(409, `Email already registered`);
  }

  const existingOtp = await Otp.findOne({
    email,
    status: "pending",
    expiry: { $gt: new Date() },
    type: "verification",
  });

  if (existingOtp) {
    throw new ApiError(
      409,
      `OTP already sent to ${email}, please check your email`
    );
  }

  const newOtp = await Otp.create({ email, type: "verification" });

  res
    .status(200)
    .json(new ApiResponse(200, {}, `OTP sent successfully to ${email}`));
});

// -------------verify otp---------------
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  //  check if phone or email is present and otp must be present
  if (!email || !otp) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  let existingOtp = await Otp.findOne({
    email,
    otp,
    status: "pending",
  });

  if (existingOtp) existingOtp.status = "verified";

  if (!existingOtp) throw new ApiError(400, "Invalid OTP");

  await existingOtp.save({
    validateBeforeSave: false,
  });
  res.status(200).json(new ApiResponse(200, {}, "OTP verified successfully"));
});

// -------------register donation camp---------------
const registerDonationCamp = asyncHandler(async (req, res, next) => {
  const {
    organizationName,
    organizationType,
    organizerName,
    organizerMobileNumber,
    organizerEmail,
    coOrganizerName,
    coOrganizerMobileNumber,
    campName,
    address,
    bloodbank,
    campDate,
    campStartTime,
    campEndTime,
    estimatedParticipants,
    supporter,
    remarks,
    password,
    confirmPassword,
  } = req.body;

  if (
    !organizationName ||
    !organizationType ||
    !organizerName ||
    !organizerMobileNumber ||
    !organizerEmail ||
    !campName ||
    !campDate ||
    !campStartTime ||
    !address ||
    !campEndTime ||
    !estimatedParticipants ||
    !password ||
    !confirmPassword
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  if (
    !address ||
    !address.addressLine1 ||
    !address.state ||
    !address.city ||
    !address.pincode
  ) {
    throw new ApiError(400, "All address fields are required");
  }

  const verifiedEmail = await Otp.findOne({
    email: organizerEmail,
    status: "verified",
  });

  if (!verifiedEmail) {
    throw new ApiError(400, "Please verify your email first");
  }

  const existingUser = await DonationCamp.findOne({ organizerEmail });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const donationCamp = await DonationCamp.create({
    organizationName,
    organizationType,
    organizerName,
    organizerMobileNumber,
    organizerEmail,
    coOrganizerName,
    coOrganizerMobileNumber,
    campName,
    address: {
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      state: address.state,
      city: address.city,
      pincode: address.pincode,
      addressType: "Camp",
    },
    bloodbank,
    campDate,
    campStartTime,
    campEndTime,
    estimatedParticipants,
    supporter,
    remarks,
    password,
  });

  const accessToken = await donationCamp.generateAuthToken();
  const refreshToken = await donationCamp.generateRefreshToken();

  if (!accessToken || !refreshToken) {
    throw new ApiError(500, "Token generation failed");
  }

  const donationCampObject = donationCamp.toObject();
  delete donationCampObject.password;

  res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        { donationCampObject },
        "Donation Camp registered successfully , Awaiting blood bank approval"
      )
    );
});
// -------------login blood bank---------------
const loginBloodBank = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!password || !email) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  let existingUser = await BloodBank.findOne({ email }).select("+password");

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const validPassword = await existingUser.checkPassword(password);

  if (!validPassword) {
    throw new ApiError(400, "Invalid credentials");
  }

  const accessToken = await existingUser.generateAuthToken();
  const refreshToken = await existingUser.generateRefreshToken();

  if (!accessToken || !refreshToken) {
    throw new ApiError(500, "Token generation failed");
  }

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, existingUser, "User logged in successfully"));
});
// -------------Get blood bank---------------
const getBloodBank = asyncHandler(async (req, res, next) => {
  const user = req.user;
  res.status(200).json(new ApiResponse(200, user, "User profile fetched"));
});

// -------------logout blood bank---------------
const logoutBloodBank = asyncHandler(async (req, res, next) => {
  res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export {
  sendEmailVerifyOTP,
  verifyOTP,
  registerDonationCamp,
  // registerBloodBank,
  // loginBloodBank,
  // getBloodBank,
  // logoutBloodBank,
};
