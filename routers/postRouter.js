const router = require("express").Router();
const Post = require("../models/postModel");
const auth = require("../middleware/auth");
const User = require("../models/userModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "adposts",
    allowedFormats: ["jpg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});
const parser = multer({ storage: storage });

const { allBranches, allYears, postLimit } = require("../constants");

router.post("/", [auth, parser.single("image")], async (req, res) => {
  try {
    // console.log(req.body);
    // console.log(req.file);

    const { heading, description } = req.body;
    const allowedBranches = JSON.parse(req.body.allowedBranches);
    const allowedYears = JSON.parse(req.body.allowedYears);
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
    const remainingPosts = userById.postsRemaining;
    if (remainingPosts == 0)
      return res.status(400).json({
        errorMessage: `Only ${postLimit} posts can be posted at once. Delete some to post more.`,
      });

    const allowedCollege = userById.college;

    const newPost = new Post({
      heading,
      description,
      postedBy,
      img: { url: req.file.path, filename: req.file.filename },
      allowedBranches,
      allowedYears,
      allowedCollege,
    });

    const savedPost = await newPost.save();
    userById.posts.push(savedPost._id);
    userById.postsRemaining = remainingPosts - 1;
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
    const userById = await User.findById(req.user);
    const index = userById.bookmarks.indexOf(req.params.id);
    if (index !== -1) {
      await userById.bookmarks.splice(index, 1);
      await userById.save();
      res.json(userById);
    } else {
      const bookmarkedPost = await Post.findById(req.params.id);
      userById.bookmarks.push(bookmarkedPost._id);
      await userById.save();
      res.json(userById);
    }
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
    const postById = await Post.findById(req.params.id);
    const author = postById.postedBy;
    if (author != req.user)
      return res.status(401).json({ errorMessage: "Unauthorized" });
    await Post.findByIdAndDelete(req.params.id);
    const userById = await User.findById(req.user);
    const remainingPosts = userById.postsRemaining;
    userById.postsRemaining = remainingPosts + 1;
    var index = userById.posts.indexOf(req.params.id);
    if (index !== -1) await userById.posts.splice(index, 1);
    index = userById.bookmarks.indexOf(req.params.id);
    if (index !== -1) await userById.bookmarks.splice(index, 1);
    userById.save();
    cloudinary.uploader.destroy(postById.img.filename, function (err, result) {
      console.log(result);
    });
    res.json(userById);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

module.exports = router;
