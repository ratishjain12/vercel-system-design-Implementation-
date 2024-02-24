import express from "express";
import cors from "cors";
import { S3 } from "aws-sdk";
import dotenv from "dotenv";
import mimetype from "mime-types";
dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
});

const app = express();
app.use(express.json());
app.use(cors());

app.get("/*", async (req, res) => {
  const hostname = req.hostname;
  const id = hostname.split(".")[0];
  const filepath = req.path;
  const contents = await s3
    .getObject({
      Bucket: "vercel-storage-bucket",
      Key: `dist/${id}${filepath}`,
    })
    .promise();

  const ext = filepath.split(".").pop();
  const type = mimetype.lookup(ext as string);
  console.log(type);

  if (typeof type === "string") {
    res.set("Content-Type", type);

    // Check if the file is an SVG and set the correct content type
    if (type === "image/svg+xml") {
      res.set("Content-Type", "image/svg+xml");
    }
  }
  res.send(contents.Body);
});

app.listen(3001);
