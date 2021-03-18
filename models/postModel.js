const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    description: { type: String, required: true },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    allowedBranches: [{ type: String }],
    allowedYears: [{ type: String }],
    allowedCollege: { type: String },
  },
  { timestamps: true }
);

const Post = mongoose.model("post", postSchema);

module.exports = Post;
