import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getTokenSecret } from "@/lib/env";
import { mcpUserContextSchema } from "@/lib/schemas";

const toBase64Url = (buffer) =>
  buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
};

const getKey = () => createHash("sha256").update(getTokenSecret()).digest();

export const issueAccessToken = (payload) => {
  const validated = mcpUserContextSchema.parse(payload);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(validated), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map(toBase64Url).join(".");
};

export const readAccessToken = (token) => {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Malformed access token.");
  }

  const [ivPart, tagPart, encryptedPart] = parts.map(fromBase64Url);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), ivPart);
  decipher.setAuthTag(tagPart);

  const decrypted = Buffer.concat([
    decipher.update(encryptedPart),
    decipher.final(),
  ]).toString("utf8");

  const payload = mcpUserContextSchema.parse(JSON.parse(decrypted));

  if (payload.expiresAt <= Date.now()) {
    throw new Error("Access token expired.");
  }

  return payload;
};
