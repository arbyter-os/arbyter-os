import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns/promises";
import https from "node:https";
import { EventEmitter } from "node:events";
import {
  fetchValidatedExternalUrl,
  validateExternalUrl,
} from "./validate-external-url.ts";


const httpsRequest = https.request;
const dnsLookup = dns.lookup;

test.afterEach(() => {
  https.request = httpsRequest;
  dns.lookup = dnsLookup;
});

test("allows a public HTTPS destination", async () => {
  const result = await validateExternalUrl("https://93.184.216.34/health", {
    protocols: ["https:"],
  });
  assert.equal(result.valid, true);
});

test("blocks loopback, private, link-local, and reserved IPv4 destinations", async () => {
  for (const host of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.1.1",
    "192.0.2.1",
    "198.51.100.1",
    "203.0.113.1",
    "224.0.0.1",
  ]) {
    const result = await validateExternalUrl(`https://${host}/`, {
      protocols: ["https:"],
    });
    assert.equal(result.valid, false, host);
  }
});

test("blocks IPv6 loopback and internal destinations", async () => {
  for (const host of ["[::1]", "[fc00::1]", "[fe80::1]"]) {
    const result = await validateExternalUrl(`https://${host}/`, {
      protocols: ["https:"],
    });
    assert.equal(result.valid, false, host);
  }
});

test("rejects HTTP when execution policy allows HTTPS only", async () => {
  const result = await validateExternalUrl("http://93.184.216.34/", {
    protocols: ["https:"],
  });
  assert.equal(result.valid, false);
});

test("pinned fetch uses the validated address and does not follow redirects", async () => {
  const validation = await validateExternalUrl("https://93.184.216.34/start", {
    protocols: ["https:"],
  });
  assert.equal(validation.valid, true);
  if (!validation.valid) return;

  let requestOptions: any;
  https.request = ((options: any, callback: (response: EventEmitter) => void) => {
    requestOptions = options;
    const response = new EventEmitter() as EventEmitter & {
      statusCode?: number;
      statusMessage?: string;
      headers?: Record<string, string>;
    };
    response.statusCode = 302;
    response.statusMessage = "Found";
    response.headers = { location: "http://127.0.0.1/private" };

    const request = new EventEmitter() as EventEmitter & {
      write: (body: Buffer) => void;
      end: () => void;
    };
    request.write = () => {};
    request.end = () => {
      callback(response);
      response.emit("end");
    };
    return request as any;
  }) as typeof https.request;

  const response = await fetchValidatedExternalUrl(validation, {
    method: "POST",
    headers: { "X-Test": "1" },
    body: "payload",
  });

  assert.equal(response.status, 302);
  assert.equal(requestOptions.hostname, "93.184.216.34");
  assert.equal(requestOptions.path, "/start");
  assert.equal(requestOptions.method, "POST");
});


test("pinned HTTPS connects to the validated IP while preserving hostname SNI on Node 20+", async () => {
  dns.lookup = (async () => [{ address: "93.184.216.34", family: 4 }]) as unknown as typeof dns.lookup;
  const validation = await validateExternalUrl("https://example.com/health", {
    protocols: ["https:"],
  });
  assert.equal(validation.valid, true);
  if (!validation.valid) return;

  let requestOptions: any;
  https.request = ((options: any, callback: (response: EventEmitter) => void) => {
    requestOptions = options;
    const response = new EventEmitter() as EventEmitter & { statusCode?: number; statusMessage?: string; headers?: Record<string, string> };
    response.statusCode = 200;
    response.statusMessage = "OK";
    response.headers = {};
    const request = new EventEmitter() as EventEmitter & { end: () => void };
    request.end = () => { callback(response); response.emit("end"); };
    return request as any;
  }) as typeof https.request;

  const response = await fetchValidatedExternalUrl(validation);
  assert.equal(response.status, 200);
  assert.equal(requestOptions.hostname, "93.184.216.34");
  assert.equal(requestOptions.servername, "example.com");
  assert.equal(requestOptions.headers.host, "example.com");
});

test("execution layer routes both API and webhook configurable endpoints through validation and pinned fetch", async () => {
  const fs = await import("node:fs/promises");
  const executorSource = await fs.readFile("./lib/orchestrator/executor.ts", "utf8");
  assert.doesNotMatch(executorSource, /fetch\(route\.endpointUrl/);
  assert.equal((executorSource.match(/fetchValidatedExternalUrl\(endpointValidation/g) ?? []).length, 2);
  assert.equal((executorSource.match(/validateExternalUrl\(route\.endpointUrl/g) ?? []).length, 2);
  assert.match(executorSource, /provider: 'api'/);
  assert.match(executorSource, /provider: 'webhook'/);
});

test("connector verification also uses the pinned primitive for configurable endpoints", async () => {
  const fs = await import("node:fs/promises");
  const verifySource = await fs.readFile("./app/api/agents/verify/route.ts", "utf8");
  assert.doesNotMatch(verifySource, /fetch\(targetUrl/);
  assert.match(verifySource, /fetchValidatedExternalUrl\(endpointValidation/);
});
