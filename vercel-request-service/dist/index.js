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
const aws_sdk_1 = require("aws-sdk");
const dotenv_1 = __importDefault(require("dotenv"));
const mime_types_1 = __importDefault(require("mime-types"));
dotenv_1.default.config();
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.get("/*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hostname = req.hostname;
    const id = hostname.split(".")[0];
    const filepath = req.path;
    const contents = yield s3
        .getObject({
        Bucket: "vercel-storage-bucket",
        Key: `dist/${id}${filepath}`,
    })
        .promise();
    const ext = filepath.split(".").pop();
    const type = mime_types_1.default.lookup(ext);
    console.log(type);
    if (typeof type === "string") {
        res.set("Content-Type", type);
        // Check if the file is an SVG and set the correct content type
        if (type === "image/svg+xml") {
            res.set("Content-Type", "image/svg+xml");
        }
    }
    res.send(contents.Body);
}));
app.listen(3001);
