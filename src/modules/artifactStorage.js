const path = require("path");
const { S3Client, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { env } = require("../config/env");

let r2Client = null;

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function isR2PrivateArtifactsEnabled() {
  if (!toBool(env.r2PrivateArtifactsEnabled, false)) {
    return false;
  }

  return Boolean(
    env.r2BucketEndpoint &&
    env.r2BucketName &&
    env.r2AccessKeyId &&
    env.r2SecretAccessKey
  );
}

function getR2Client() {
  if (!isR2PrivateArtifactsEnabled()) {
    return null;
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: env.r2BucketEndpoint,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey
      }
    });
  }

  return r2Client;
}

function normalizeRelativeArtifactPath(relativePath) {
  const cleaned = String(relativePath || "").replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!cleaned) {
    return "";
  }
  if (cleaned.includes("..")) {
    return "";
  }
  return cleaned;
}

function buildR2ArtifactKey(relativePath) {
  const normalizedPath = normalizeRelativeArtifactPath(relativePath);
  if (!normalizedPath) {
    return "";
  }

  const prefix = String(env.r2PrivateArtifactsPrefix || "app-updates")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .trim();

  return prefix ? `${prefix}/${normalizedPath}` : normalizedPath;
}

async function headR2Artifact(relativePath) {
  const client = getR2Client();
  const key = buildR2ArtifactKey(relativePath);

  if (!client || !key) {
    return null;
  }

  try {
    const response = await client.send(new HeadObjectCommand({
      Bucket: env.r2BucketName,
      Key: key
    }));

    return {
      key,
      exists: true,
      contentLength: Number(response.ContentLength || 0),
      contentType: String(response.ContentType || "application/octet-stream"),
      etag: response.ETag || "",
      lastModified: response.LastModified || null
    };
  } catch (error) {
    const status = Number(error?.$metadata?.httpStatusCode || 0);
    if (status === 404 || error?.name === "NotFound" || error?.Code === "NoSuchKey") {
      return {
        key,
        exists: false
      };
    }

    throw error;
  }
}

async function getR2ArtifactStream(relativePath) {
  const client = getR2Client();
  const key = buildR2ArtifactKey(relativePath);

  if (!client || !key) {
    return null;
  }

  try {
    const response = await client.send(new GetObjectCommand({
      Bucket: env.r2BucketName,
      Key: key
    }));

    return {
      key,
      stream: response.Body,
      contentLength: Number(response.ContentLength || 0),
      contentType: String(response.ContentType || "application/octet-stream"),
      etag: response.ETag || "",
      lastModified: response.LastModified || null,
      fileName: path.basename(relativePath)
    };
  } catch (error) {
    const status = Number(error?.$metadata?.httpStatusCode || 0);
    if (status === 404 || error?.name === "NotFound" || error?.Code === "NoSuchKey") {
      return null;
    }

    throw error;
  }
}

module.exports = {
  isR2PrivateArtifactsEnabled,
  normalizeRelativeArtifactPath,
  buildR2ArtifactKey,
  headR2Artifact,
  getR2ArtifactStream
};
