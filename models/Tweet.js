const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TweetSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },
  text: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  avatar: {
    type: String
  },
  retweets: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "users"
      }
    }
  ],
  likes: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "users"
      }
    }
  ],
  comments: [
    {
      tweet: {
        type: Schema.Types.ObjectId,
        ref: "tweets"
      },
      user: {
        type: Schema.Types.ObjectId,
        ref: "users"
      },
      text: {
        type: String
        // required: true
      },
      name: {
        type: String
      },
      avatar: {
        type: String
      },
      retweets: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: "users"
          }
        }
      ],
      likes: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: "users"
          }
        }
      ]
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Tweet = mongoose.model("tweet", TweetSchema);
