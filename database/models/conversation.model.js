const mongoose = require("mongoose");

const Converstations = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  members: { type: [String], required: true },
  messages: { type: [String] },
  owner: { type: String, required: true },
});

const model = mongoose.model("Converstations", Converstations);

module.exports = model;
