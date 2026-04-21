import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "js-yaml";
import SwaggerParser from "@apidevtools/swagger-parser";

const root = process.cwd();
const openApiPath = path.join(root, "docs", "openapi", "openapi-v1.yaml");
const postmanPath = path.join(root, "docs", "openapi", "postman-v1.collection.json");

const httpMethods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizePath(rawPath) {
  if (!rawPath) return "/";
  let p = String(rawPath).trim();

  p = p.replace(/^\{\{baseUrl\}\}/i, "");
  p = p.replace(/^https?:\/\/[^/]+/i, "");

  const q = p.indexOf("?");
  if (q >= 0) p = p.slice(0, q);

  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/{2,}/g, "/");
  if (p.length > 1) p = p.replace(/\/+$/, "");

  // Normalize Postman variables first ({{id}}), then OpenAPI path params ({id}).
  p = p.replace(/\{\{[^}]+\}\}/g, "{param}");
  p = p.replace(/\{[^}]+\}/g, "{param}");

  return p;
}

function endpointKey(method, routePath) {
  return `${method.toUpperCase()} ${normalizePath(routePath)}`;
}

function collectOpenApiEndpoints(spec) {
  const endpoints = new Set();
  const paths = spec?.paths || {};

  for (const [routePath, operations] of Object.entries(paths)) {
    if (!operations || typeof operations !== "object") continue;
    for (const [method] of Object.entries(operations)) {
      if (!httpMethods.has(method.toLowerCase())) continue;
      endpoints.add(endpointKey(method, routePath));
    }
  }

  return endpoints;
}

function resolvePostmanRawUrl(urlNode) {
  if (typeof urlNode === "string") return urlNode;
  if (urlNode && typeof urlNode === "object") {
    if (typeof urlNode.raw === "string") return urlNode.raw;
    if (Array.isArray(urlNode.path)) {
      const joined = urlNode.path.join("/");
      return joined.startsWith("/") ? joined : `/${joined}`;
    }
  }
  return "";
}

function walkPostmanItems(items, endpoints) {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (item?.request?.method) {
      const method = String(item.request.method || "").toLowerCase();
      const rawUrl = resolvePostmanRawUrl(item.request.url);
      if (httpMethods.has(method) && rawUrl) {
        endpoints.add(endpointKey(method, rawUrl));
      }
    }
    if (Array.isArray(item?.item)) {
      walkPostmanItems(item.item, endpoints);
    }
  }
}

function collectPostmanEndpoints(collection) {
  const endpoints = new Set();
  walkPostmanItems(collection?.item, endpoints);
  return endpoints;
}

function printList(title, values) {
  if (!values.length) return;
  console.error(`\n${title}`);
  for (const v of values) {
    console.error(`- ${v}`);
  }
}

async function main() {
  if (!fs.existsSync(openApiPath)) {
    throw new Error(`Missing OpenAPI file: ${openApiPath}`);
  }
  if (!fs.existsSync(postmanPath)) {
    throw new Error(`Missing Postman collection file: ${postmanPath}`);
  }

  const openApiDoc = yaml.load(fs.readFileSync(openApiPath, "utf8"));
  await SwaggerParser.validate(openApiDoc);

  const postmanCollection = readJson(postmanPath);
  if (!postmanCollection?.info?.name || !Array.isArray(postmanCollection?.item)) {
    throw new Error("Postman collection format invalid: missing info.name or item[]");
  }

  const openApiEndpoints = collectOpenApiEndpoints(openApiDoc);
  const postmanEndpoints = collectPostmanEndpoints(postmanCollection);

  const unknownInPostman = [...postmanEndpoints].filter((ep) => !openApiEndpoints.has(ep)).sort();
  const missingInPostman = [...openApiEndpoints].filter((ep) => !postmanEndpoints.has(ep)).sort();

  if (unknownInPostman.length || missingInPostman.length) {
    console.error("API contract validation failed.");
    printList("Postman endpoints not found in OpenAPI:", unknownInPostman);
    printList("OpenAPI endpoints missing in Postman (strict parity):", missingInPostman);
    process.exit(1);
  }

  const covered = [...openApiEndpoints].filter((ep) => postmanEndpoints.has(ep)).length;
  const coverage = openApiEndpoints.size === 0 ? 100 : (covered / openApiEndpoints.size) * 100;

  console.log("OpenAPI is valid.");
  console.log(`OpenAPI endpoints: ${openApiEndpoints.size}`);
  console.log(`Postman endpoints: ${postmanEndpoints.size}`);
  console.log(`Coverage: ${coverage.toFixed(1)}%`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
