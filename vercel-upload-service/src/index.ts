import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils";
import path from "path";
import { getAllFiles } from "./file";
import { uploadFile } from "./aws";
import { createClient } from "redis";

let redisPort = 6379; // Replace with your redis port
let redisHost = "127.0.0.1"; // Replace with your redis host
const publisher = createClient({
  socket: {
    port: redisPort,
    host: redisHost,
  },
});

(async () => {
  // Connect to redis server
  await publisher.connect();
})();

const subscriber = createClient({
  socket: {
    port: redisPort,
    host: redisHost,
  },
});

(async () => {
  // Connect to redis server
  await subscriber.connect();
})();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/deploy", async (req, res) => {
  const repoUrl = req.body.repoUrl;
  console.log(repoUrl);
  const id = generate();

  try {
    // Clone the GitHub repository
    await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

    // Get all files path from the directory cloned in the output folder
    const allFilesPath = getAllFiles(path.join(__dirname, `output/${id}`));

    // Upload each file to AWS S3
    const uploadPromises = allFilesPath.map(async (file) => {
      await uploadFile(
        file.slice(__dirname.length + 1).replace(/\\/g, "/"),
        file
      );
    });

    // Wait for all upload promises to complete
    await Promise.all(uploadPromises);

    // Update status and send response only after all uploads are successful
    publisher.lPush("build-queue", id);
    publisher.hSet("status", id, "uploaded");

    res.json({
      id,
    });
  } catch (error) {
    console.error("Error during deployment:", error);
    // Handle the error and send an appropriate response if needed
    res.status(500).json({
      error: "Deployment failed.",
    });
  }
});

app.get("/status", async (req, res) => {
  const id = req.query.id;
  const status = await subscriber.hGet("status", id as string);
  res.json({ status });
});
app.listen(3000);
