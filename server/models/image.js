const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("image", imageSchema);
