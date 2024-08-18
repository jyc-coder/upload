const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    // 이미지 fileName
    imageKey: {
      type: String,
      required: true,
    },
    // 이미지 originalFileName
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

module.exports = mongoose.model("profile", profileSchema);
