import assert from "node:assert/strict";
import { sameOrigin } from "../lib/http.ts";

const request = headers => new Request("https://internal.example/api/appointments", { method: "POST", headers });
assert.equal(sameOrigin(request({ host: "spa.example", origin: "https://spa.example" })), true);
assert.equal(sameOrigin(request({ host: "spa.example", origin: "https://other.example" })), false);
assert.equal(sameOrigin(request({ host: "spa.example", origin: "http://spa.example" })), false);
assert.equal(sameOrigin(request({ host: "spa.example", origin: "null" })), false);
assert.equal(sameOrigin(request({ host: "spa.example", "sec-fetch-site": "cross-site" })), false);
assert.equal(sameOrigin(request({ host: "spa.example", origin: "https://spa.example", "sec-fetch-site": "same-origin" })), true);
console.log("PASS: browser origin, proxy hostname, cross-site requests, invalid origins and protocol mismatch");
