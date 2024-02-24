import { S3 } from "aws-sdk";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const s3 = new S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
});
export const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  const res = await s3
    .upload({
      Body: fileContent,
      Bucket: "vercel-storage-bucket",
      Key: fileName,
    })
    .promise();
  console.log(res);
};
