const express = require("express");
const router = express.Router();
// const request = require("request");
const config = require("config");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Tweet = require("../../models/Tweet");
const { check, validationResult } = require("express-validator");

// @route POST api/posts
// @desc Crete a post
// @access Private
router.post(
  "/",
  [
    auth,
    [
      check("text", "Text is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const newTweet = new Tweet({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      const tweet = await newTweet.save();

      return res.json(tweet);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
);

// @route GET api/posts
// @desc Get all posts
// @access Private
router.get("/", auth, async (req, res) => {
  try {
    const tweets = await Tweet.find().sort({ date: -1 });
    res.json(tweets);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route GET api/posts/:id
// @desc Get single post by Id
// @access Private
router.get("/:id", auth, async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) return res.status(404).json({ msg: "Tweet not found" });
    res.json(tweet);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId")
      return res.status(404).json({ msg: "Tweet not found" });
    res.status(500).send("Server Error");
  }
});

// @route Delete api/posts/:id
// @desc Delete a post
// @access Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    // check tweet
    if (!tweet) return res.status(404).json({ msg: "Tweet not found" });

    // check user
    if (tweet.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }
    await tweet.remove();

    res.json({ msg: "Tweet removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId")
      return res.status(404).json({ msg: "Tweet not found" });
    res.status(500).send("Server Error");
  }
});

/**
|--------------------------------------------------
| Likes
|--------------------------------------------------
*/
// @route Put api/posts/like/:post_id
// @desc Like a tweet
// @access Private
router.put("/like/:tweet_id", auth, async (req, res) => {
  const newLike = { user: req.user.id };
  try {
    const tweet = await Tweet.findById(req.params.tweet_id);

    // Check if the tweet is already liked by the user
    if (
      tweet.likes.filter(like => like.user.toString() === newLike.user).length >
      0
    ) {
      return res.status(400).json({ msg: "Tweet already liked" });
    }
    // Check if tweet author and liker is the same person
    if (tweet.user.toString() === newLike.user) {
      return res.status(400).json({ msg: "Narcissism alert" });
    }
    tweet.likes.unshift(newLike);
    await tweet.save();
    res.json(tweet.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route Delete api/posts/unlike/:post_id
// @desc Like a tweet
// @access Private
router.delete("/unlike/:tweet_id", auth, async (req, res) => {
  const newLike = { user: req.user.id };

  try {
    const tweet = await Tweet.findById(req.params.tweet_id);
    const filtered = tweet.likes.filter(like => like.user == newLike.user);

    // Chcek if tweet is already liked
    if (filtered.length === 0) {
      return res.status(401).json({ msg: "Not liked yet" });
    }
    const delIndex = tweet.likes.map(like =>
      like.user.toString().indexOf(newLike.user)
    );
    tweet.likes.splice(delIndex, 1);

    await tweet.save();
    return res.json(tweet.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

/**
|--------------------------------------------------
| Comments
|--------------------------------------------------
*/
// @route POST api/posts/comment/:post_id
// @desc Comment on a tweet
// @access Private
router.post(
  "/comment/:tweet_id",
  [
    auth,
    [
      check("text", "Text is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const tweet = await Tweet.findById(req.params.tweet_id);
      const newComment = {
        text: req.body.text,
        user: user.id,
        avatar: user.avatar,
        name: user.name
      };
      // console.log("tweet", tweet);
      tweet.comments.unshift(newComment);
      await tweet.save();
      return res.json(tweet.comments);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
);

// @route Delete api/tweets/comment/:tweet_id
// @desc Delete a comment on a tweet
// @access Private
router.delete("/comment/:tweet_id/:comment_id", auth, async (req, res) => {
  const tweet = await Tweet.findById(req.params.tweet_id);
  try {
    // Pull out the comment
    const delComment = tweet.comments.find(
      comment => comment.id.toString() === req.params.comment_id
    );
    // Check comment
    if (!delComment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }
    // Check if comment belongs to user
    if (delComment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    const delIndex = tweet.comments.indexOf(delComment);
    tweet.comments.splice(delIndex, 1);

    await tweet.save();
    res.json(tweet.comments);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
