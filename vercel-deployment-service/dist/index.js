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
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const aws_1 = require("./aws");
let redisPort = 6379;
let redisHost = "127.0.0.1";
const subcriber = (0, redis_1.createClient)({
    socket: {
        port: redisPort,
        host: redisHost,
    },
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield subcriber.connect();
}))();
const publisher = (0, redis_1.createClient)({
    socket: {
        port: redisPort,
        host: redisHost,
    },
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield publisher.connect();
}))();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        while (1) {
            const response = yield subcriber.brPop((0, redis_1.commandOptions)({ isolated: true }), "build-queue", 0);
            //@ts-ignore
            const id = response.element;
            yield (0, aws_1.uploadBuildAfterNpmInstallAndBuild)(`output/${id}`, id);
            publisher.hSet("status", id, "deployed");
        }
    });
}
main();
