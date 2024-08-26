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
const path = require("path");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");

const PORT = process.env.PORT || 3000;

// s3 설정
const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
// 파일 저장시 경로 ,이름 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) =>
    // mime-type과 uuid를 이용해서 같은 파일이라도 중복되지 않게 이름을 설정
    cb(null, `${uuid()}.${mime.extension(file.mimetype)}`),
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "jyc-bucket",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `${uuid()}.${mime.extension(file.mimetype)}`);
    },
  }),
  // fileFilter: (req, file, cb) => {
  //   if (["image/jpeg", "image/png"].includes(file.mimetype)) cb(null, true);
  //   else cb(new Error("이미지 파일만 업로드 가능합니다."), false);
  // },
  // 파일 사이즈 제한
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(
  cors({
    "Access-Control-Allow-Origin": "*",
    "Allow-Methods": "GET, POST, PUT, DELETE",
  })
);

app.use(express.static(path.join(__dirname, "../front/dist")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/dist/index.html"));
});
// 업로드된 이미지를 가져오기 위한 미들웨어
// app.use("/uploads", express.static("uploads"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("mongoDB is connected");
    // 프로필 업로드
    app.post("/profiles", upload.single("image"), async (req, res) => {
      console.log(req);
      const profile = new Profile({
        image: req.file.location,
        name: req.body.name,
        description: req.body.description,
      });
      console.log(profile);
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

        // 프로필 총 갯수 데이터도 같이 전달
        const totalProfileCount = await Profile.countDocuments();
        res.status(200).json({
          profiles,
          totalProfileCount,
        });
      } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, message: err.message });
      }
    });

    app.listen(PORT || 3000, () =>
      console.log(`Server is running on ${PORT || 3000}`)
    );
  })
  .catch((err) => console.log(err));
