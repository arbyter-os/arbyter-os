import assert from "node:assert/strict";
import { createServer, type RequestListener } from "node:http";
import test from "node:test";
import {
  fetchValidatedExternalUrl,
  MAX_EXTERNAL_RESPONSE_BYTES,
} from "../lib/security/validate-external-url.ts";

function validation(port: number) {
  return {
    valid: true as const,
    url: new URL(`http://127.0.0.1:${port}/`),
    addresses: ["127.0.0.1"],
  };
}

async function withServer(
  handler: RequestListener,
  fn: (port: number) => Promise<void>,
) {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  try {
    await fn(address.port);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("response below the limit succeeds", async () => {
  await withServer((_req, res) => {
    res.end("ok");
  }, async (port) => {
    const response = await fetchValidatedExternalUrl(validation(port));
    assert.equal(await response.text(), "ok");
  });
});

test("response exactly at the limit succeeds", async () => {
  await withServer((_req, res) => {
    res.end(Buffer.alloc(MAX_EXTERNAL_RESPONSE_BYTES, 65));
  }, async (port) => {
    const response = await fetchValidatedExternalUrl(validation(port));
    assert.equal((await response.arrayBuffer()).byteLength, MAX_EXTERNAL_RESPONSE_BYTES);
  });
});

test("response exceeding the limit fails", async () => {
  await withServer((_req, res) => {
    res.end(Buffer.alloc(MAX_EXTERNAL_RESPONSE_BYTES + 1, 65));
  }, async (port) => {
    await assert.rejects(
      fetchValidatedExternalUrl(validation(port)),
      /External response is too large\./g,
    );
  });
});

test("oversized Content-Length is rejected before buffering", async () => {
  await withServer((_req, res) => {
    res.writeHead(200, { "Content-Length": String(MAX_EXTERNAL_RESPONSE_BYTES + 1) });
    res.end("small");
  }, async (port) => {
    await assert.rejects(
      fetchValidatedExternalUrl(validation(port)),
      /External response is too large\./g,
    );
  });
});

test("a response without Content-Length is still limited", async () => {
  await withServer((_req, res) => {
    res.write(Buffer.alloc(MAX_EXTERNAL_RESPONSE_BYTES, 65));
    res.end(Buffer.from("x"));
  }, async (port) => {
    await assert.rejects(
      fetchValidatedExternalUrl(validation(port)),
      /External response is too large\./g,
    );
  });
});

test("a chunked response that exceeds the limit is stopped", async () => {
  await withServer((_req, res) => {
    res.write(Buffer.alloc(MAX_EXTERNAL_RESPONSE_BYTES, 65));
    setImmediate(() => res.end(Buffer.from("x")));
  }, async (port) => {
    await assert.rejects(
      fetchValidatedExternalUrl(validation(port)),
      /External response is too large\./g,
    );
  });
});
