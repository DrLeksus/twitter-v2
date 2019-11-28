const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectID,
    ref: "user"
  },
  tweets: [
    {
      type: mongoose.Schema.Types.ObjectID,
      ref: "tweet"
    }
  ],
  company: {
    type: String
  },
  website: {
    type: String
  },
  bio: {
    type: String
  },
  location: {
    type: String
  },
  birthDate: {
    type: Date
  },
  following: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "user"
      }
    }
  ],
  follows: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "user"
      }
    }
  ],
  likes: [
    {
      tweet: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "tweet"
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Profile = mongoose.model("profile", ProfileSchema);
