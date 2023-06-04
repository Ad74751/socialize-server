const mongoose = require("mongoose");

const User = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contacts: { type: [String] },
  conversations: { type: [String] },
});

const model = mongoose.model("Users", User);

module.exports = model;
