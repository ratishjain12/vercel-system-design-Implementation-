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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const simple_git_1 = __importDefault(require("simple-git"));
const utils_1 = require("./utils");
const path_1 = __importDefault(require("path"));
const file_1 = require("./file");
const aws_1 = require("./aws");
const redis_1 = require("redis");
let redisPort = 6379; // Replace with your redis port
let redisHost = "127.0.0.1"; // Replace with your redis host
const publisher = (0, redis_1.createClient)({
    socket: {
        port: redisPort,
        host: redisHost,
    },
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Connect to redis server
    yield publisher.connect();
}))();
const subscriber = (0, redis_1.createClient)({
    socket: {
        port: redisPort,
        host: redisHost,
    },
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Connect to redis server
    yield subscriber.connect();
}))();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/deploy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repoUrl = req.body.repoUrl;
    console.log(repoUrl);
    const id = (0, utils_1.generate)();
    try {
        // Clone the GitHub repository
        yield (0, simple_git_1.default)().clone(repoUrl, path_1.default.join(__dirname, `output/${id}`));
        // Get all files path from the directory cloned in the output folder
        const allFilesPath = (0, file_1.getAllFiles)(path_1.default.join(__dirname, `output/${id}`));
        // Upload each file to AWS S3
        const uploadPromises = allFilesPath.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, aws_1.uploadFile)(file.slice(__dirname.length + 1).replace(/\\/g, "/"), file);
        }));
        // Wait for all upload promises to complete
        yield Promise.all(uploadPromises);
        // Update status and send response only after all uploads are successful
        publisher.lPush("build-queue", id);
        publisher.hSet("status", id, "uploaded");
        res.json({
            id,
        });
    }
    catch (error) {
        console.error("Error during deployment:", error);
        // Handle the error and send an appropriate response if needed
        res.status(500).json({
            error: "Deployment failed.",
        });
    }
}));
app.get("/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    const status = yield subscriber.hGet("status", id);
    res.json({ status });
}));
app.listen(3000);
