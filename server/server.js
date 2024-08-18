// .env 파일을 사용하기 위한 설정
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const { v4: uuid } = require("uuid");
const mime = require("mime-types");
const Profile = require("./models/profile");
const multer = require("multer");
// 파일 저장시 경로 ,이름 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) =>
    // mime-type과 uuid를 이용해서 같은 파일이라도 중복되지 않게 이름을 설정
    cb(null, `${uuid()}.${mime.extension(file.mimetype)}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("이미지 파일만 업로드 가능합니다."), false);
  },
  // 파일 사이즈 제한
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(
  cors({
    "Access-Control-Allow-Origin": "*",
    "Allow-Methods": "GET, POST, PUT, DELETE",
  })
);

// 업로드된 이미지를 가져오기 위한 미들웨어
app.use("/uploads", express.static("uploads"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("mongoDB is connected");
    // 프로필 업로드
    app.post("/profiles", upload.single("image"), async (req, res) => {
      const profile = new Profile({
        imageKey: req.file.filename,
        originalFileName: req.file.originalname,
        name: req.body.name,
        description: req.body.description,
      });
      await profile.save().then(() => {
        res.status(200).json({
          success: true,
          imageKey: req.file.filename,
        });
      });
    });

    // 프로필 가져오기 w 페이지네이션
    app.get("/profiles", async (req, res) => {
      try {
        const { offset, limit } = req.query;
        const profiles = await Profile.find()
          .sort({ createdAt: -1 })
          .skip(parseInt(offset))
          .limit(parseInt(limit));

        console.log(profiles);
        res.json(profiles);
      } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, message: err.message });
      }
    });

    app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
  })
  .catch((err) => console.log(err));

const PORT = 3000;
