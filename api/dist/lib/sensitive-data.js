import crypto from "node:crypto";
import { config } from "../config.js";
const encryptionKey = crypto
    .createHash("sha256")
    .update(config.DATA_ENCRYPTION_KEY ?? config.JWT_REFRESH_SECRET)
    .digest();
export function encryptSensitive(value) {
    if (!value)
        return undefined;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return [
        "v1",
        iv.toString("base64url"),
        cipher.getAuthTag().toString("base64url"),
        encrypted.toString("base64url"),
    ].join(".");
}
export function protectedValue(value) {
    if (!value)
        return undefined;
    return { encrypted: encryptSensitive(value), last4: value.slice(-4) };
}
