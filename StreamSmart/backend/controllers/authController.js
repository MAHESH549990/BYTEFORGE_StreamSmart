
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  console.log("LOGIN ROUTE HIT");
  console.log("Request body:", req.body);

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    console.log("Searching for user...");

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    console.log("User found:", Boolean(user));

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("LOGIN CONTROLLER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
