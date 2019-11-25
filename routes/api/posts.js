const express = require("express");
const router = express.Router();
// const request = require("request");
const config = require("config");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");
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
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      const post = await newPost.save();

      return res.json(post);
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
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
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
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId")
      return res.status(404).json({ msg: "Post not found" });
    res.status(500).send("Server Error");
  }
});

// @route Delete api/posts/:id
// @desc Delete a post
// @access Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // check post
    if (!post) return res.status(404).json({ msg: "Post not found" });

    // check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }
    await post.remove();

    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId")
      return res.status(404).json({ msg: "Post not found" });
    res.status(500).send("Server Error");
  }
});

/**
|--------------------------------------------------
| Likes
|--------------------------------------------------
*/
// @route Put api/posts/like/:post_id
// @desc Like a post
// @access Private
router.put("/like/:post_id", auth, async (req, res) => {
  const newLike = { user: req.user.id };
  try {
    const post = await Post.findById(req.params.post_id);

    // Check if the post is already liked by the user
    if (
      post.likes.filter(like => like.user.toString() === newLike.user).length >
      0
    ) {
      return res.status(400).json({ msg: "Post already liked" });
    }
    // Check if post author and liker is the same person
    if (post.user.toString() === newLike.user) {
      return res.status(400).json({ msg: "Narcissism alert" });
    }
    post.likes.unshift(newLike);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route Delete api/posts/unlike/:post_id
// @desc Like a post
// @access Private
router.delete("/unlike/:post_id", auth, async (req, res) => {
  const newLike = { user: req.user.id };

  try {
    const post = await Post.findById(req.params.post_id);
    const filtered = post.likes.filter(like => like.user == newLike.user);

    // Chcek if post is already liked
    if (filtered.length === 0) {
      return res.status(401).json({ msg: "Not liked yet" });
    }
    const delIndex = post.likes.map(like =>
      like.user.toString().indexOf(newLike.user)
    );
    post.likes.splice(delIndex, 1);

    await post.save();
    return res.json(post.likes);
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
// @desc Comment on a post
// @access Private
router.post(
  "/comment/:post_id",
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
      const post = await Post.findById(req.params.post_id);
      const newComment = {
        text: req.body.text,
        user: user.id,
        avatar: user.avatar,
        name: user.name
      };
      // console.log("post", post);
      post.comments.unshift(newComment);
      await post.save();
      return res.json(post.comments);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
);

// @route Delete api/posts/uncomment/:post_id
// @desc Delete a comment on a post
// @access Private
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
  const post = await Post.findById(req.params.post_id);
  try {
    // Pull out the comment
    const delComment = post.comments.find(
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

    const delIndex = post.comments.indexOf(delComment);
    post.comments.splice(delIndex, 1);

    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
