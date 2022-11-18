const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PaylistSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    userId: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },

    songs: {
      type: [mongoose.Types.ObjectId],
      ref: "sounds",
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("playlists", PaylistSchema);
