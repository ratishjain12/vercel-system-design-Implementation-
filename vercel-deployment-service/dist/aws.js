"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBuildAfterNpmInstallAndBuild = exports.uploadFile = exports.uploadBuild = exports.runNpmInstallAndBuild = exports.downloadS3Folder = void 0;
const aws_sdk_1 = require("aws-sdk");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const file_1 = require("./file");
dotenv_1.default.config();
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
});
function downloadS3Folder(prefix) {
    return __awaiter(this, void 0, void 0, function* () {
        const listParams = {
            Bucket: "vercel-storage-bucket",
            Prefix: prefix,
        };
        try {
            const allFiles = yield s3.listObjectsV2(listParams).promise();
            const downloadPromises = [];
            for (const { Key } of allFiles.Contents || []) {
                if (!Key) {
                    continue;
                }
                const localOutputPath = path_1.default.join(__dirname, Key);
                const outputFile = fs_1.default.createWriteStream(localOutputPath);
                const dirName = path_1.default.dirname(localOutputPath);
                if (!fs_1.default.existsSync(dirName)) {
                    fs_1.default.mkdirSync(dirName, { recursive: true });
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
            yield Promise.all(downloadPromises);
            console.log("Download completed successfully.");
        }
        catch (error) {
            console.error("Error during S3 download:", error);
        }
    });
}
exports.downloadS3Folder = downloadS3Folder;
//run build on the project
function runNpmInstallAndBuild(id) {
    return new Promise((resolve, reject) => {
        var _a, _b;
        const child = (0, child_process_1.exec)(`cd ${path_1.default.join(__dirname, `output/${id}`)} && npm install && npm run build`);
        (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on("data", function (data) {
            console.log("stdout: " + data);
        });
        (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on("data", function (data) {
            console.log("stderr: " + data);
        });
        child.on("close", function (code) {
            if (code === 0) {
                resolve("");
            }
            else {
                reject(new Error(`Build process exited with code ${code}`));
            }
        });
    });
}
exports.runNpmInstallAndBuild = runNpmInstallAndBuild;
//upload dist folder to s3
function uploadBuild(id) {
    return new Promise((resolve) => {
        const folderpath = path_1.default.join(__dirname, `output/${id}/dist`);
        const allFiles = (0, file_1.getAllFiles)(folderpath);
        allFiles.forEach((file) => __awaiter(this, void 0, void 0, function* () {
            yield (0, exports.uploadFile)((`dist/${id}/` + file.slice(folderpath.length + 1)).replace(/\\/g, "/"), file);
        }));
        resolve("");
    });
}
exports.uploadBuild = uploadBuild;
const uploadFile = (fileName, localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    const fileContent = fs_1.default.readFileSync(localFilePath);
    const res = yield s3
        .upload({
        Body: fileContent,
        Bucket: "vercel-storage-bucket",
        Key: fileName,
    })
        .promise();
    console.log(res);
});
exports.uploadFile = uploadFile;
function uploadBuildAfterNpmInstallAndBuild(prefix, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield downloadS3Folder(prefix);
            yield runNpmInstallAndBuild(id);
            yield uploadBuild(id);
        }
        catch (error) {
            console.error("Error during npm install and build:", error);
        }
    });
}
exports.uploadBuildAfterNpmInstallAndBuild = uploadBuildAfterNpmInstallAndBuild;
