import { S3 } from "aws-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { getAllFiles } from "./file";

dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
});

export async function downloadS3Folder(prefix: string) {
  const listParams = {
    Bucket: "vercel-storage-bucket",
    Prefix: prefix,
  };

  try {
    const allFiles = await s3.listObjectsV2(listParams).promise();

    const downloadPromises = [];

    for (const { Key } of allFiles.Contents || []) {
      if (!Key) {
        continue;
      }

      const localOutputPath = path.join(__dirname, Key);
      const outputFile = fs.createWriteStream(localOutputPath);
      const dirName = path.dirname(localOutputPath);

      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }

      const downloadPromise = new Promise((resolve, reject) => {
        s3.getObject({ Bucket: "vercel-storage-bucket", Key })
          .createReadStream()
          .pipe(outputFile)
          .on("finish", resolve)
          .on("error", reject);
      });

      downloadPromises.push(downloadPromise);
    }

    // Wait for all download promises to complete
    await Promise.all(downloadPromises);

    console.log("Download completed successfully.");
  } catch (error) {
    console.error("Error during S3 download:", error);
  }
}

//run build on the project
export function runNpmInstallAndBuild(id: string) {
  return new Promise((resolve, reject) => {
    const child = exec(
      `cd ${path.join(
        __dirname,
        `output/${id}`
      )} && npm install && npm run build`
    );

    child.stdout?.on("data", function (data) {
      console.log("stdout: " + data);
    });
    child.stderr?.on("data", function (data) {
      console.log("stderr: " + data);
    });

    child.on("close", function (code) {
      if (code === 0) {
        resolve("");
      } else {
        reject(new Error(`Build process exited with code ${code}`));
      }
    });
  });
}

//upload dist folder to s3
export function uploadBuild(id: string) {
  return new Promise((resolve) => {
    const folderpath = path.join(__dirname, `output/${id}/dist`);
    const allFiles = getAllFiles(folderpath);
    allFiles.forEach(async (file) => {
      await uploadFile(
        (`dist/${id}/` + file.slice(folderpath.length + 1)).replace(/\\/g, "/"),
        file
      );
    });
    resolve("");
  });
}

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

export async function uploadBuildAfterNpmInstallAndBuild(
  prefix: string,
  id: string
) {
  try {
    await downloadS3Folder(prefix);
    await runNpmInstallAndBuild(id);
    await uploadBuild(id);
  } catch (error) {
    console.error("Error during npm install and build:", error);
  }
}
