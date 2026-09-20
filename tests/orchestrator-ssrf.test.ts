import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { executeProvider } from "../lib/orchestrator/executor.ts"
import { validateExternalUrl } from "../lib/security/validate-external-url.ts"

const protocols = ["https:", "http:"]

async function assertBlocked(url: string) {
  const result = await validateExternalUrl(url, { protocols })
  assert.equal(result.valid, false)
}

test("public HTTPS destinations are accepted by the existing URL policy", async () => {
  const result = await validateExternalUrl("https://1.1.1.1/", {
    protocols: ["https:"],
  })
  assert.equal(result.valid, true)
})

test("localhost is blocked", async () => {
  await assertBlocked("http://localhost:8080/")
})

test("IPv4 loopback is blocked", async () => {
  await assertBlocked("http://127.0.0.1:8080/")
})

test("IPv6 loopback is blocked", async () => {
  await assertBlocked("http://[::1]:8080/")
})

test("private IPv4 ranges are blocked", async () => {
  await assertBlocked("http://10.0.0.1/")
  await assertBlocked("http://172.16.0.1/")
  await assertBlocked("http://192.168.1.1/")
})

test("link-local and reserved IPv4 addresses are blocked", async () => {
  await assertBlocked("http://169.254.169.254/")
  await assertBlocked("http://192.0.2.1/")
  await assertBlocked("http://198.51.100.1/")
  await assertBlocked("http://203.0.113.1/")
})

test("disallowed execution URL schemes are rejected", async () => {
  const result = await validateExternalUrl("file:///etc/passwd", {
    protocols,
  })
  assert.equal(result.valid, false)
})

test("API execution validates its configurable endpoint before connecting", async () => {
  await assert.rejects(
    executeProvider(
      {
        provider: "api",
        connectionId: "connection-1",
        connectionType: "api",
        endpointUrl: "http://127.0.0.1:8080/",
        configuration: {},
      },
      {
        taskId: "task-1",
        agentId: "agent-1",
        organizationId: "org-1",
        action: "messages.send",
        input: { message: "hello" },
      },
    ),
    /Private, local, reserved, or otherwise unsafe network endpoints cannot be accessed/,
  )
})

test("webhook execution validates its configurable endpoint before connecting", async () => {
  await assert.rejects(
    executeProvider(
      {
        provider: "webhook",
        connectionId: "connection-1",
        connectionType: "webhook",
        endpointUrl: "http://10.0.0.1/",
        configuration: {},
      },
      {
        taskId: "task-1",
        agentId: "agent-1",
        organizationId: "org-1",
        action: "messages.send",
        input: { message: "hello" },
      },
    ),
    /Private, local, reserved, or otherwise unsafe network endpoints cannot be accessed/,
  )
})

test("execution does not use raw fetch with a configurable endpoint", async () => {
  const source = await readFile(new URL("../lib/orchestrator/executor.ts", import.meta.url), "utf8")
  assert.doesNotMatch(source, /fetch\(route\.endpointUrl/)
  assert.match(source, /fetchValidatedExternalUrl\(validation/)
})

test("validated outbound transport does not automatically follow redirects", async () => {
  const source = await readFile(new URL("../lib/security/validate-external-url.ts", import.meta.url), "utf8")
  assert.match(source, /http\.request\(requestOptions, handleResponse\)/)
  assert.match(source, /https\.request\(requestOptions, handleResponse\)/)
})
