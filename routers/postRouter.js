const router = require("express").Router();
const Post = require("../models/postModel");
const auth = require("../middleware/auth");
const User = require("../models/userModel");

router.post("/", auth, async (req, res) => {
  try {
    const { heading, description } = req.body;
    const postedBy = req.user;
    const newPost = new Post({
      heading,
      description,
      postedBy,
    });

    const savedPost = await newPost.save();
    const userById = await User.findById(req.user);
    userById.posts.push(savedPost);
    await userById.save();
    res.json(savedPost);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const Posts = await Post.find();
    res.json(Posts);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    // const user = await User.findById(req.user);
    const user = await User.findById(req.user).populate("posts");
    res.json(user.posts);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const Posts = await Post.findById(req.params.id);
    res.json(Posts);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

module.exports = router;
