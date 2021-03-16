const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  college: { type: String, required: true },
  year: { type: Number, required: true },
  branch: { type: String, required: true },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bookmarks" }],
});

const User = mongoose.model("user", userSchema);

module.exports = User;
