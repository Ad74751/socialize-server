const express = require("express");
const User = require("./database/models/user.model");
const Converstations = require("./database/models/conversation.model");
const jwt = require("jsonwebtoken");
authRouter = express.Router();

authRouter.post("/login", async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
    password: req.body.password,
  });
  if (user) {
    const token = jwt.sign(
      {
        name: user.name,
        email: user.email,
        id: user._id,
      },
      "secret123"
    );

    res.json({ status: "ok", user: token, msg: "Login Succesful" });
  } else {
    res.json({ status: "error", user: null, msg: "User Not Found" });
  }
});

authRouter.post("/register", async (req, res) => {
  try {
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      contacts: [],
      conversations: [],
    });
    const token = jwt.sign(
      {
        name: user.name,
        email: user.email,
        id: user._id,
      },
      "secret123"
    );
    res.json({ status: "ok", msg: "success", user: token });
  } catch (err) {
    res.json({
      status: "error",
      msg: "The provdided email id already exists!",
    });
  }
});

authRouter.get("/user", async (req, res) => {
  const token = req.headers["x-access-token"];
  try {
    const decodedToken = jwt.decode(token);
    const email = decodedToken.email;
    const user = await User.findOne({
      email: email,
    });
    if (user) {
      res.json({
        status: "ok",
        msg: "success",
        user: { email: user.email, name: user.name, id: user._id },
      });
    }
  } catch (e) {
    res.json({ status: "error", msg: "Invalid Token", user: null });
  }
});

authRouter.get("/user/contacts", async (req, res) => {
  const token = req.headers["x-access-token"];
  try {
    const decodedToken = jwt.decode(token);
    const email = decodedToken.email;
    const user = await User.findOne({
      email: email,
    });
    if (user) {
      res.json({
        status: "ok",
        msg: "success",
        contacts: user.contacts,
      });
    }
  } catch (e) {
    res.json({ status: "error", msg: "Invalid Token", user: null });
  }
});

authRouter.get("/user/coversations", async (req, res) => {
  const token = req.headers["x-access-token"];
  try {
    const decodedToken = jwt.decode(token);
    const email = decodedToken.email;
    const user = await User.findOne({
      email: email,
    });
    if (user) {
      res.json({
        status: "ok",
        msg: "success",
        conversations: user.conversations,
      });
    }
  } catch (e) {
    res.json({ status: "error", msg: "Invalid Token", user: null });
  }
});

authRouter.get("/user/getcoversation", async (req, res) => {
  const token = req.headers["x-access-token"];
  try {
    const decodedToken = jwt.decode(token);
    const conversation = await Converstations.findOne({
      _id: req.query.convid,
    });

    if (conversation && conversation.members.indexOf(decodedToken.id) !== -1) {
      res.json({
        status: "ok",
        msg: "success",
        conversation: conversation,
      });
    } else {
      res.json({
        status: "error",
        msg: "You are not a member of the channel",
      });
    }
  } catch (e) {
    res.json({ status: "error", msg: "Invalid Token" });
  }
});

authRouter.get("/user/addcontact", async (req, res) => {
  const token = req.headers["x-access-token"];
  try {
    const decodedToken = jwt.decode(token);
    const email = decodedToken.email;
    const user = await User.findOne({
      email: email,
    });
    const uname = await User.findById(req.query.userid);
    if (user) {
      if (user.contacts.indexOf(req.query.userid + ":" + uname.name) === -1) {
        user.contacts.push(req.query.userid + ":" + uname.name);
        await user.save();
        var io = req.app.get("socketio");
        var activeUsers = req.app.get("activeUsers");
        io.to(activeUsers[user.email]).emit("new:contact", {
          contact: req.query.userid + ":" + uname.name,
        });
        res.json({
          status: "ok",
          msg: "success",
        });
      } else {
        res.json({
          status: "error",
          msg: "The user is already in your contacts",
        });
      }
    }
  } catch (e) {
    res.json({ status: "error", msg: "Invalid Token", user: null });
  }
});

authRouter.get("/user/deletecontact", async (req, res) => {
  const token = req.headers["x-access-token"];
  try {
    const decodedToken = jwt.decode(token);
    const email = decodedToken.email;
    const user = await User.findOne({
      email: email,
    });
    const contacts = user.contacts;
    if (user) {
      if (user.contacts.indexOf(req.query.userid) !== -1) {
        user.contacts.pull(req.query.userid);
        await user.save();
        var io = req.app.get("socketio");
        var activeUsers = req.app.get("activeUsers");
        io.to(activeUsers[user.email]).emit("delete:contact", {
          contact: contacts.filter((item) => item !== req.query.userid),
        });
        res.json({
          status: "ok",
          msg: "success",
        });
      } else {
        res.json({
          status: "error",
          msg: "No user found to delete",
        });
      }
    }
  } catch (e) {
    res.json({ status: "error", msg: "Invalid Token", user: null });
  }
});

authRouter.get("/user/all", async (req, res) => {
  const token = req.headers["x-access-token"];
  try {
    const decodedToken = jwt.decode(token);
    const user = await User.find({});
    if (user) {
      var users = [];
      user.forEach((usr) => {
        if (usr.email !== decodedToken.email) {
          users.push({ id: usr._id, name: usr.name });
        }
      });
      res.json({
        status: "ok",
        msg: "success",
        users: users,
      });
    }
  } catch (e) {
    res.json({ status: "error", msg: "Invalid Token", user: null });
  }
});
authRouter.post("/user/conversation/new", async (req, res) => {
  const token = req.headers["x-access-token"];
  try {
    const decodedToken = jwt.decode(token);
    const conv_name = req.body.convname;
    const conv_owner = decodedToken.id;
    const conv_members = () => {
      let mem = [];
      req.body.members.split(",").forEach((m) => {
        mem.push(m.split(":")[0]);
      });
      mem.push(conv_owner);
      return mem;
    };
    const conv = await Converstations.create({
      name: conv_name,
      members: conv_members(),
      messages: [],
      owner: conv_owner,
    });
    conv.members.forEach(async (m) => {
      const user = await User.findById(m.split(":")[0]);
      user.conversations.push(conv._id + ":" + conv.name);
      await user.save();
    });
    // var io = req.app.get("socketio");
    // io.to(conv._id).emit("new:conversation", { conversation: conv });
    res.json({
      status: "ok",
      msg: `Conversation ${conv.name} created succesfully`,
    });
  } catch (e) {
    res.json({ status: "error", msg: "Invalid Token", user: null });
  }
});
authRouter.get("/user/conversation/delete", async (req, res) => {
  const token = req.headers["x-access-token"];
  try {
    const decodedToken = jwt.decode(token);
    const conv = await Converstations.findById(req.query.convid);
    if (conv.owner === decodedToken.id) {
      const members = conv.members;
      members.forEach(async (m) => {
        const user = await User.findOne({ _id: m });
        const convs = req.query.convid + ":" + conv.name;
        user.conversations.pull(convs);
        await user.save();
      });
      await Converstations.findByIdAndDelete(req.query.convid);
      // var io = req.app.get("socketio");
      // io.to(conv._id).emit("update-conversation",)
      res.json({
        status: "ok",
        msg: `Conversation ${conv.name} deleted succesfully`,
      });
    } else {
      res.json({
        status: "error",
        msg: `Sorry you do not have the privilages to delete the conversation`,
      });
    }
  } catch (e) {
    res.json({ status: "error", msg: "Invalid Token", user: null });
  }
});

module.exports = authRouter;
