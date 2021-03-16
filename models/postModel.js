const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  description: { type: String, required: true },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Post = mongoose.model("post", postSchema);

module.exports = Post;
