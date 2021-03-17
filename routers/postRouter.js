const router = require("express").Router();
const Post = require("../models/postModel");
const auth = require("../middleware/auth");
const User = require("../models/userModel");
const { allBranches, allYears } = require("../constants");

router.post("/", auth, async (req, res) => {
  try {
    const { heading, description, allowedBranches, allowedYears } = req.body;
    const postedBy = req.user;

    allowedBranches.map((branch) => {
      if (allBranches.indexOf(branch) === -1)
        return res.status(400).json({ errorMessage: "Invalid branch" });
    });

    allowedYears.map((year) => {
      if (allYears.indexOf(year) === -1)
        return res.status(400).json({ errorMessage: "Invalid year" });
    });
    const userById = await User.findById(req.user);
    const allowedCollege = userById.college;
    const newPost = new Post({
      heading,
      description,
      postedBy,
      allowedBranches,
      allowedYears,
      allowedCollege,
    });

    const savedPost = await newPost.save();
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
    const allPosts = await Post.find();
    const userById = await User.findById(req.user);
    var visiblePosts = [];
    allPosts.map((post) => {
      if (
        post.allowedBranches.indexOf(userById.branch) !== -1 &&
        post.allowedYears.indexOf(userById.year) !== -1 &&
        post.allowedCollege === userById.college
      )
        visiblePosts.push(post);
    });

    res.json(visiblePosts);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).populate("posts");
    res.json(user.posts);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/bookmark", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).populate("bookmarks");
    res.json(user.bookmarks);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/bookmark/:id", auth, async (req, res) => {
  try {
    const bookmarkedPost = await Post.findById(req.params.id);
    const userById = await User.findById(req.user);
    userById.bookmarks.push(bookmarkedPost);
    await userById.save();
    res.json(bookmarkedPost);
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

router.delete("/:id", auth, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    const userFound = await User.findById(req.user);
    var index = userFound.posts.indexOf(req.params.id);
    if (index !== -1) await userFound.posts.splice(index, 1);
    index = userFound.bookmarks.indexOf(req.params.id);
    if (index !== -1) await userFound.bookmarks.splice(index, 1);
    userFound.save();
    res.json(userFound);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

module.exports = router;
