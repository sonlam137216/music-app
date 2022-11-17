const _ = require("lodash");
const User = require("../models/user.model");
const generateTokens = require("../utils/createToken");
const sendMail = require("./sendMail.controller");

const { google } = require("googleapis");
const { OAuth2 } = google.auth;

const client = new OAuth2(process.env.CLIENT_ID);

const userCtrl = {
  getUserInfo: async (req, res) => {
    try {
      const userId = req.params.id;

      if (!userId) {
        res.status(404).json({ success: false, message: "Missing ID" });
      }

      const user = await User.findOne({ _id: userId });

      if (!user)
        res.status(400).json({ success: false, message: "Not found User" });

      res.json({ success: true, message: "Get user success", user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Interal server error" });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) return res.status(400).json({ msg: "Missing username" });

      const updatedUser = await User.findOneAndUpdate(
        { _id: req.userId },
        {
          username,
        },
        {
          new: true,
        }
      );

      const userInfo = _.pick(updatedUser, ["_id", "username", "email"]);

      res.json({
        success: true,
        message: "Updated successfully",
        userInfo,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error!" });
    }
  },

  deleteUser: async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      res.status(404).json({ success: false, message: "Missing userId" });
    }

    const user = await User.deleteOne({ _id: userId });

    if (!user) {
      res.status(400).json({ success: false, message: "Delete user failed" });
    }

    res.json({ success: true, message: "Delete user successfully" });
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Not found user!" });
      }

      const { accessToken } = generateTokens(user);
      const url = `${process.env.CLIENT_URL}/user/reset/${accessToken}`;

      const data = await sendMail(
        email,
        "Reset password",
        url,
        "Reset your password"
      );

      res.json({
        success: true,
        message: "Please check email to reset password!",
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error!" });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { password } = req.body;

      const passwordHash = await bcrypt.hash(password, 12);

      await User.findOneAndUpdate(
        { _id: req.userId },
        {
          password: passwordHash,
        }
      );

      return res.json({
        success: true,
        message: "Reset password successfully!",
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error!" });
    }
  },

  googleLogin: async (req, res) => {
    const { tokenId } = req.body;

    const verify = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.CLIENT_ID,
    });

    const { email_verified, email, name, picture } = verify.payload;

    const password = email + process.env.GOOGLE_SECRET;

    const passwordHash = await bcrypt.hash(password, 12);

    if (!email_verified)
      return res
        .status(400)
        .json({ success: false, message: "Verify email with google failed!" });

    const user = await User.findOne({ email });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({
          success: false,
          message: "[LOGIN GOOGLE] Password not match!",
        });

      return res.json({ success: true, message: "Login google successfully!" });
    } else {
      const newUser = new User({
        name,
        email,
        password: passwordHash,
        avatar: picture,
      });

      await newUser.save();

      return res.json({ success: true, message: "Login google successfully!" });
    }
  },

  createAdmin: async (req, res) => {
    try {
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error!" });
    }
  },
};

module.exports = userCtrl;