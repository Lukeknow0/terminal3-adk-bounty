import {
  T3nClient,
  TenantClient,
  createEthAuthInput,
  eth_get_address,
  getNodeUrl,
  loadWasmComponent,
  metamask_sign,
  setEnvironment,
} from "@terminal3/t3n-sdk";

const key = process.env.T3N_API_KEY;

if (!key) {
  console.log("T3N_API_KEY is not set. Skipping live T3N handshake.");
  console.log("Get a sandbox key from https://www.terminal3.io/claim-page");
  process.exit(0);
}

if (process.env.RUN_T3N_LIVE !== "1") {
  console.log("T3N_API_KEY is present, but RUN_T3N_LIVE is not 1.");
  console.log("Refusing to use the key unless explicitly requested.");
  process.exit(0);
}

setEnvironment(process.env.T3N_ENVIRONMENT ?? "testnet");

const wasmComponent = await loadWasmComponent();
const address = eth_get_address(key);
const client = new T3nClient({
  wasmComponent,
  handlers: {
    EthSign: metamask_sign(address, undefined, key),
  },
});

await client.handshake();
const did = await client.authenticate(createEthAuthInput(address));
const tenantDid = did.value;
const tenant = new TenantClient({
  t3n: client,
  baseUrl: getNodeUrl(),
  tenantDid,
});

let tenantRecord = null;
try {
  tenantRecord = await tenant.me();
} catch (error) {
  tenantRecord = { error: error.message };
}

console.log(
  JSON.stringify(
    {
      environment: process.env.T3N_ENVIRONMENT ?? "testnet",
      nodeUrl: getNodeUrl(),
      tenantDid: redactDid(tenantDid),
      tenantRecord,
      note: "The API key was used only from process.env and was not written to disk.",
    },
    null,
    2,
  ),
);

function redactDid(did) {
  return did.replace(/^(did:t3n:.{6}).+(.{4})$/, "$1...$2");
}
