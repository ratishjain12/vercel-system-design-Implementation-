import { createClient, commandOptions } from "redis";

import {
  downloadS3Folder,
  runNpmInstallAndBuild,
  uploadBuild,
  uploadBuildAfterNpmInstallAndBuild,
} from "./aws";

let redisPort = 6379;
let redisHost = "127.0.0.1";
const subcriber = createClient({
  socket: {
    port: redisPort,
    host: redisHost,
  },
});

(async () => {
  await subcriber.connect();
})();

const publisher = createClient({
  socket: {
    port: redisPort,
    host: redisHost,
  },
});

(async () => {
  await publisher.connect();
})();

async function main() {
  while (1) {
    const response = await subcriber.brPop(
      commandOptions({ isolated: true }),
      "build-queue",
      0
    );
    //@ts-ignore
    const id = response.element;
    await uploadBuildAfterNpmInstallAndBuild(`output/${id}`, id);
    publisher.hSet("status", id, "deployed");
  }
}

main();
