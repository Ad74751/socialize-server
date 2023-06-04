const mongoose = require("mongoose");
PASSWORD = "RbK5BQhkkSC6axP";
URL = `mongodb+srv://user1:${PASSWORD}@cluster0.hmeyh.mongodb.net/socializechat?retryWrites=true&w=majority`;

module.exports = mongoose.connect(URL);