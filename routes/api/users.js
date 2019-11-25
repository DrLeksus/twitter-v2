const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const config = require("config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

// @route POST api/users
// @desc Register User
// @access Public
router.post(
  "/",
  [
    // Validate the user input
    check("name", "Please add name")
      .not()
      .isEmpty(),
    check("email", "Please enter a vaild email").isEmail(),
    check("password", "Please enter a strong password").isLength({ min: 5 })
  ],
  async (req, res) => {
    // If there actually is invalid or erroneous information in the request...
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if the user already exits
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exits" }] });
      }

      // Fetch either placeholder or actual avatar
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm"
      });

      // Create an user instance
      user = new User({
        name,
        email,
        avatar,
        password
      });

      // Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save in DB
      await user.save();

      // Get JWT
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
          return res.json({ msg: "Successfully registered", token });
          // // console.log("token", token);
        }
      );
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route PUT api/users
// @desc Update User
// @access Private

// @route Delete api/users
// @desc Delete User
// @access Private

module.exports = router;
