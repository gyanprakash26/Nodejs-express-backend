import catchAsync from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { onUploadCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.accessToken = accessToken; /// assign AT to save in db
    user.save({ validateBeforeSave: false }); // used to ignore validate when AT save it ask for the required field
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something wents wrong while Token genrate");
  }
};

const register = catchAsync(async (req, res) => {
  const { username, email, fullname, password } = req.body;
  if (
    [username, email, fullname, password].some((field) => field?.trim() === "") // check for empty field
  ) {
    throw new ApiError(400, "All field are requird");
  }
  const userExist = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (userExist) {
    throw new ApiError(409, "User or email already exist");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocal = req.files?.coverImage[0]?.path
  let coverImageLocal;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.lenght > 0
  ) {
    coverImageLocal = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await onUploadCloudinary(avatarLocalPath);
  const coverImage = await onUploadCloudinary(coverImageLocal);
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!userCreated) {
    throw new ApiError(500, "Somrthing went wrong while registeration");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "Register successfully"));
});

const login = catchAsync(async (req, res) => {
  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(401, "Invalide user credential");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalide Password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findOneAndUpdate(user._id, {
    $set: {
      refreshToken: refreshToken,
    },
  }).select("-password -refreshToken");
  const options = {
    httpOnly: true,
    secure: true,
  }; ////    this used for change cookie only by server side not on the client side
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        "User login successfull"
      )
    );
});
const logout = catchAsync(async (req, res) => {
  await User.findOneAndUpdate(
    req.body._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Log out succesfully"));
});
const refreshAccessToken = catchAsync(async (req, res) => {
  const inComingToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!inComingToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = await jwt.verify(
      inComingToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken) {
      throw new ApiError(401, "Token  invalide");
    }

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (inComingToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changePassword = catchAsync(async () => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordMatch = user.isPasswordCorrect(oldPassword);
  if (!isPasswordMatch) {
    throw new ApiError(400, "Invalid old Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  res.status(200).json(new ApiResponse(200, "Password save success"));
});
const getUser = catchAsync(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User Details"));
});
const updateUser = catchAsync(async(req,res)=>{
  const {fullname,email} = req.body
  if(!(fullname || email)){
    throw new ApiError(400,"One of the field requird fullname or email")
  }
  const user = await User.findByIdAndUpdate(user.body?._id,
    {
      $set:{
        fullname,
        email
      }
    },
    {
      new: true
    }
    ).select("-password")
  return res.status(200).json(new ApiResponse(200, user, "User Details"));

})
const updateAvatar = catchAsync(async(req,res)=>{
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing")
  }

  //TODO: delete old image - assignment

  const avatar = await onUploadCloudinary(avatarLocalPath)
  console.log(avatar)

  if (!avatar.url) {
      throw new ApiError(400, "Error while uploading on avatar")
      
  }

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set:{
              avatar: avatar.url
          }
      },
      {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
      new ApiResponse(200, user, "Avatar image updated successfully")
  )})
const updateCoverImage = catchAsync(async(req,res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400, "cover Image file is missing")
  }
  const cover = await onUploadCloudinary(coverImageLocalPath)
  if(!cover.url){
    throw new ApiError(400, "Cover file not upload")
  }
  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        coverImage:cover.url
      }
    },
    {
      new : true
    }).select("-password")
})
export { register, login, logout, refreshAccessToken, changePassword, getUser, updateUser,updateAvatar, updateCoverImage };
