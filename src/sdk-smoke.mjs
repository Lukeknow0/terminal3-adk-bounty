import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sdk from "@terminal3/t3n-sdk";

const requiredExports = [
  "T3nClient",
  "TenantClient",
  "setEnvironment",
  "loadWasmComponent",
  "eth_get_address",
  "metamask_sign",
  "createEthAuthInput",
  "getNodeUrl",
  "getScriptVersion",
];

const packageJson = await readSdkPackageJson();
const missing = requiredExports.filter((name) => typeof sdk[name] === "undefined");

console.log("Terminal 3 SDK smoke check");
console.log(`node=${process.version}`);
console.log(`sdk=${packageJson.name}@${packageJson.version}`);
console.log(`sdk.engines.node=${packageJson.engines?.node ?? "not declared"}`);

if (missing.length > 0) {
  console.error(`missing exports: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`exports ok: ${requiredExports.join(", ")}`);
}

try {
  sdk.setEnvironment("testnet");
  console.log(`testnet node url=${sdk.getNodeUrl()}`);
} catch (error) {
  console.error(`setEnvironment/getNodeUrl failed: ${error.message}`);
  process.exitCode = 1;
}

console.log("No T3N_API_KEY was read and no live auth/network call was made.");

async function readSdkPackageJson() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packagePath = path.resolve(
    here,
    "../node_modules/@terminal3/t3n-sdk/package.json",
  );
  return JSON.parse(await readFile(packagePath, "utf8"));
}
