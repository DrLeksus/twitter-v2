const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const config = require("config");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const auth = require("../../middleware/auth");
const User = require("../../models/User");

// @route     POST api/auth
// @desc      Auth user and get token
// @access    Public
router.post(
  "/",
  [
    // Express-Validator Checks
    check("email", "Not a valid email").isEmail(),
    check("password", "Enter your password").exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Since request is valid , let's move on
    const { email, password } = req.body;

    try {
      // Get the user
      // Look for the provided email in the DB & check if pw matches
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      // Match the password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }
      // Prepare the payload
      const payload = {
        user: {
          id: user.id
        }
      };

      // Encode the token, then send token
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 36000
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
          // // console.log("token", token);
        }
      );
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  }
);

// @route     GET api/auth
// @desc      Get logged in user
// @access    Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error.");
  }
});

module.exports = router;
