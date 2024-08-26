// .env 파일을 사용하기 위한 설정
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const { v4: uuid } = require("uuid");
const mime = require("mime-types");
const Profile = require("./models/profile");
const multer = require("multer");
const path = require("path");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");

const PORT = process.env.PORT || 3000;

console.log(process.env.MONGO_URI);
console.log(process.env.AWS_ACCESS_KEY_ID);
console.log(process.env.AWS_SECRET_ACCESS_KEY);

// s3 설정
const s3 = new aws.S3({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// presigned url 생성
const getSignedUrl = ({ key }) => {
  return new Promise((resolve, reject) => {
    s3.createPresignedPost(
      {
        Bucket: "jyc-bucket",
        Fields: {
          key,
        },
        Expires: 240, // seconds
        Conditions: [
          ["content-length-range", 0, 50 * 1000 * 1000],
          // ["starts-with", "$Content-Type", "image/"],
        ],
      },
      (err, data) => {
        if (err) reject(err);
        resolve(data);
      }
    );
  });
};
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
  limits: { fileSize: 5 * 1024 * 1024 },
});

// body-parser
app.use(express.json());
app.use(express.static(path.join(__dirname, "../front/dist")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/dist/index.html"));
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("mongoDB is connected");

    // presigned url 생성
    app.post("/presigned", async (req, res) => {
      try {
        const { contentTypes } = req.body;

        const presignedData = await Promise.all(
          contentTypes.map(async (contentType) => {
            const imageKey = `${uuid()}.${mime.extension(contentType)}`;
            const presigned = await getSignedUrl({ key: imageKey });
            return { imageKey, presigned };
          })
        );
        console.log(presignedData);
        res.status(200).json({ presignedData });
      } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, message: err.message });
      }
    });

    // presigned url을 이용해서 프로필 생성
    app.post("/profiles", upload.single("image"), async (req, res) => {
      const { image, name, description } = req.body;

      console.log(req);
      const profile = new Profile({
        image,
        name,
        description,
      });
      console.log(profile);
      await profile.save().then(() => {
        res.status(200).json({
          success: true,
          profile,
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
