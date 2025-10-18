import crypto from "crypto";

const accessKey = "ExeQueue-Alpha-Team-Secret-2025";
const keyHash = crypto.createHash("md5").update(accessKey).digest("hex");

console.log("MD5 hash:", keyHash);
