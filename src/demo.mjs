import { createHash } from "node:crypto";

const tenantDid = deterministicDid("enterprise-procurement-tenant");
const agentDid = deterministicDid("policy-guard-agent");
const userDid = deterministicDid("data-owner-alice");
const tenantId = tenantDid.replace("did:t3n:", "");
const scriptName = `z:${tenantId}:procurement-policy`;

const profileVault = {
  "profile.company.name": "Example Corp",
  "profile.verified_contacts.email.value": "buyer@example.invalid",
};

const grant = {
  dataOwnerDid: userDid,
  agentDid,
  scripts: [
    {
      scriptName,
      functions: ["search-vendors", "request-purchase"],
      allowedHosts: ["api.vendor.example"],
      allowedPlaceholders: [
        "profile.company.name",
        "profile.verified_contacts.email.value",
      ],
      constraints: {
        maxAmountUsd: 250,
        allowedCategories: ["AI Tools", "SaaS"],
      },
    },
  ],
};

const scenarios = [
  {
    name: "vendor-search-no-pii",
    functionName: "search-vendors",
    input: {
      category: "AI Tools",
      item: "secure support copilot",
      maxAmountUsd: 200,
      host: "api.vendor.example",
    },
  },
  {
    name: "purchase-request-pii-placeholders",
    functionName: "request-purchase",
    input: {
      category: "AI Tools",
      item: "secure support copilot",
      amountUsd: 199,
      host: "api.vendor.example",
    },
  },
  {
    name: "blocked-over-budget",
    functionName: "request-purchase",
    input: {
      category: "AI Tools",
      item: "enterprise plan",
      amountUsd: 1200,
      host: "api.vendor.example",
    },
  },
  {
    name: "blocked-egress-host",
    functionName: "request-purchase",
    input: {
      category: "AI Tools",
      item: "unknown add-on",
      amountUsd: 50,
      host: "api.unapproved.example",
    },
  },
];

const auditLog = [];

console.log("Terminal 3 ADK minimal demo: privacy-aware procurement agent");
console.log(`tenantDid=${redactDid(tenantDid)}`);
console.log(`agentDid=${redactDid(agentDid)}`);
console.log(`scriptName=${scriptName}`);
console.log("");

for (const scenario of scenarios) {
  const result = executeAsAgent({
    scenario,
    grant,
    scriptName,
    agentDid,
    profileVault,
  });

  console.log(`## ${scenario.name}`);
  console.log(JSON.stringify(result, null, 2));
  console.log("");
}

console.log("## audit log");
console.log(JSON.stringify(auditLog, null, 2));

function executeAsAgent({ scenario, grant, scriptName, agentDid, profileVault }) {
  const policy = findPolicy(grant, {
    agentDid,
    scriptName,
    functionName: scenario.functionName,
  });

  if (!policy) {
    return deny(scenario, "agent_or_function_not_authorized");
  }

  const host = scenario.input.host;
  if (!policy.allowedHosts.includes(host)) {
    return deny(scenario, `host/http.egress_denied:${host}`);
  }

  if (!policy.constraints.allowedCategories.includes(scenario.input.category)) {
    return deny(scenario, `category_not_allowed:${scenario.input.category}`);
  }

  if (
    scenario.input.amountUsd &&
    scenario.input.amountUsd > policy.constraints.maxAmountUsd
  ) {
    return deny(
      scenario,
      `spend_limit_exceeded:${scenario.input.amountUsd}>${policy.constraints.maxAmountUsd}`,
    );
  }

  if (scenario.functionName === "search-vendors") {
    const output = {
      decision: "ALLOW",
      piiInContractMemory: false,
      outboundHost: host,
      offers: [
        {
          offerId: "offer_demo_001",
          vendor: "Vendor Sandbox",
          amountUsd: 199,
          category: scenario.input.category,
        },
      ],
    };
    audit(scenario, "ALLOW", "no_pii_vendor_search");
    return output;
  }

  if (scenario.functionName === "request-purchase") {
    const placeholderBody = {
      item: scenario.input.item,
      amountUsd: scenario.input.amountUsd,
      companyName: "{{profile.company.name}}",
      requesterEmail: "{{profile.verified_contacts.email.value}}",
    };

    const hostResult = resolvePlaceholdersInsideHost({
      body: placeholderBody,
      allowedPlaceholders: policy.allowedPlaceholders,
      profileVault,
    });

    if (!hostResult.ok) {
      return deny(scenario, hostResult.reason);
    }

    const output = {
      decision: "ALLOW",
      piiInContractMemory: false,
      outboundHost: host,
      contractSawBody: placeholderBody,
      hostResolvedPlaceholders: hostResult.resolvedPlaceholders,
      vendorReceipt: {
        id: "receipt_demo_001",
        status: "created",
        deliveredTo: "[redacted-by-host]",
      },
    };
    audit(scenario, "ALLOW", "host_resolved_placeholders");
    return output;
  }

  return deny(scenario, `unknown_function:${scenario.functionName}`);
}

function findPolicy(grant, { agentDid, scriptName, functionName }) {
  if (grant.agentDid !== agentDid) return null;
  return grant.scripts.find(
    (script) =>
      script.scriptName === scriptName &&
      script.functions.includes(functionName),
  );
}

function resolvePlaceholdersInsideHost({
  body,
  allowedPlaceholders,
  profileVault,
}) {
  const placeholders = JSON.stringify(body).match(/{{profile\.[^}]+}}/g) ?? [];
  const resolvedPlaceholders = [];

  for (const marker of placeholders) {
    const field = marker.slice(2, -2);
    if (!allowedPlaceholders.includes(field)) {
      return { ok: false, reason: `placeholder_not_permitted:${field}` };
    }
    if (!Object.hasOwn(profileVault, field)) {
      return { ok: false, reason: `placeholder_unknown:${field}` };
    }
    resolvedPlaceholders.push(field);
  }

  return { ok: true, resolvedPlaceholders };
}

function deny(scenario, reason) {
  audit(scenario, "DENY", reason);
  return {
    decision: "DENY",
    reason,
    piiInContractMemory: false,
  };
}

function audit(scenario, decision, reason) {
  auditLog.push({
    at: new Date().toISOString(),
    scenario: scenario.name,
    functionName: scenario.functionName,
    decision,
    reason,
    inputHash: hashJson(scenario.input),
  });
}

function deterministicDid(label) {
  return `did:t3n:${createHash("sha256").update(label).digest("hex").slice(0, 40)}`;
}

function redactDid(did) {
  return did.replace(/^(did:t3n:.{6}).+(.{4})$/, "$1...$2");
}

function hashJson(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 16);
}
