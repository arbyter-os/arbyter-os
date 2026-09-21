import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";

export const MAX_EXTERNAL_RESPONSE_BYTES = 1024 * 1024;

export type ExternalUrlValidationOptions = {
  protocols: string[];
};

export type ExternalUrlValidationResult =
  | { valid: true; url: URL; addresses: string[] }
  | { valid: false; error: string };

function ipv4ToNumber(address: string): number {
  return address.split(".").map(Number).reduce((value, octet) => value * 256 + octet, 0);
}

function ipv4InRange(address: string, start: string, end: string): boolean {
  const value = ipv4ToNumber(address);
  return value >= ipv4ToNumber(start) && value <= ipv4ToNumber(end);
}

function isUnsafeIpv4(address: string): boolean {
  return (
    ipv4InRange(address, "0.0.0.0", "0.255.255.255") ||
    ipv4InRange(address, "10.0.0.0", "10.255.255.255") ||
    ipv4InRange(address, "100.64.0.0", "100.127.255.255") ||
    ipv4InRange(address, "127.0.0.0", "127.255.255.255") ||
    ipv4InRange(address, "169.254.0.0", "169.254.255.255") ||
    ipv4InRange(address, "172.16.0.0", "172.31.255.255") ||
    ipv4InRange(address, "192.0.0.0", "192.0.0.255") ||
    ipv4InRange(address, "192.0.2.0", "192.0.2.255") ||
    ipv4InRange(address, "192.88.99.0", "192.88.99.255") ||
    ipv4InRange(address, "192.168.0.0", "192.168.255.255") ||
    ipv4InRange(address, "198.18.0.0", "198.19.255.255") ||
    ipv4InRange(address, "198.51.100.0", "198.51.100.255") ||
    ipv4InRange(address, "203.0.113.0", "203.0.113.255") ||
    ipv4InRange(address, "224.0.0.0", "255.255.255.255")
  );
}

function parseIpv6(address: string): bigint | null {
  let value = address.toLowerCase();
  if (value.includes(".")) {
    const lastColon = value.lastIndexOf(":");
    const ipv4 = value.slice(lastColon + 1);
    if (!net.isIPv4(ipv4)) return null;
    const numeric = ipv4ToNumber(ipv4);
    value = `${value.slice(0, lastColon)}:${(numeric >>> 16).toString(16)}:${(numeric & 0xffff).toString(16)}`;
  }
  const parts = value.split("::");
  if (parts.length > 2) return null;
  const left = parts[0] ? parts[0].split(":") : [];
  const right = parts[1] ? parts[1].split(":") : [];
  if (left.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  if (right.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  const groups = parts.length === 2
    ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
    : left;
  if (groups.length !== 8) return null;
  return groups.reduce(
    (result, group) => (result << BigInt(16)) | BigInt(parseInt(group, 16)),
    BigInt(0),
  );
}

function ipv6InRange(address: bigint, prefix: bigint, bits: number): boolean {
  const shift = BigInt(128) - BigInt(bits);
  return (address >> shift) === (prefix >> shift);
}

function isUnsafeIpv6(address: string): boolean {
  const parsed = parseIpv6(address);
  if (parsed === null) return true;
  const ranges: Array<[string, number]> = [
    ["::", 128], ["::1", 128], ["::ffff:0:0", 96], ["100::", 64],
    ["2001:2::", 48], ["2001:10::", 28], ["2001:20::", 28], ["2001:db8::", 32],
    ["2001::", 32], ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
  ];
  return ranges.some(([prefix, bits]) => {
    const parsedPrefix = parseIpv6(prefix);
    return parsedPrefix !== null && ipv6InRange(parsed, parsedPrefix, bits);
  });
}

function isUnsafeAddress(address: string): boolean {
  if (net.isIPv4(address)) return isUnsafeIpv4(address);
  if (net.isIPv6(address)) return isUnsafeIpv6(address);
  return true;
}

export async function validateExternalUrl(
  rawUrl: string,
  options: ExternalUrlValidationOptions,
): Promise<ExternalUrlValidationResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, error: "The URL is not valid." };
  }
  if (!options.protocols.includes(parsed.protocol)) {
    return { valid: false, error: `URL must use ${options.protocols.join(" or ")}.` };
  }
  if (parsed.username || parsed.password) {
    return { valid: false, error: "URLs cannot contain embedded credentials." };
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  let addresses: string[];
  try {
    if (net.isIP(hostname)) {
      addresses = [hostname];
    } else {
      const resolved = await dns.lookup(hostname, { all: true, verbatim: true });
      addresses = resolved.map((entry) => entry.address);
    }
  } catch {
    return { valid: false, error: "The endpoint hostname could not be resolved." };
  }
  if (!addresses.length || addresses.some(isUnsafeAddress)) {
    return { valid: false, error: "Private, local, reserved, or otherwise unsafe network endpoints cannot be accessed." };
  }
  return { valid: true, url: parsed, addresses };
}

/** Pin the socket lookup to the addresses validated immediately before the request. */
export async function fetchValidatedExternalUrl(
  validation: Extract<ExternalUrlValidationResult, { valid: true }>,
  init: RequestInit = {},
): Promise<Response> {
  const { url, addresses } = validation;
  const method = init.method ?? "GET";
  const headers = Object.fromEntries(new Headers(init.headers).entries());
  const body = typeof init.body === "string"
    ? Buffer.from(init.body)
    : init.body instanceof Uint8Array
      ? Buffer.from(init.body)
      : init.body instanceof ArrayBuffer
        ? Buffer.from(init.body)
        : undefined;

  // Node 20+ can reject a custom DNS lookup result during socket setup in
  // ways that are both runtime/version dependent and easy to accidentally
  // “fix” by removing the pin. Connect directly to the validated IP instead.
  // For HTTPS, keep the original hostname as SNI so certificate validation
  // still applies to the requested host. The Host header is also pinned to
  // the URL hostname rather than accepting a caller-supplied override.
  const address = addresses[0];
  if (!address) {
    return Promise.reject(new Error("No validated address is available for this connection."));
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const port = url.port || undefined;
  const hostHeader = net.isIPv6(hostname)
    ? `[${hostname}]${port ? `:${port}` : ""}`
    : `${hostname}${port ? `:${port}` : ""}`;
  headers.host = hostHeader;

  return new Promise((resolve, reject) => {
    const requestOptions = {
      protocol: url.protocol,
      hostname: address,
      port,
      path: `${url.pathname}${url.search}`,
      method,
      headers,
      servername: url.protocol === "https:" && !net.isIP(hostname) ? hostname : undefined,
      signal: init.signal ?? undefined,
    };
    const handleResponse = (response: http.IncomingMessage) => {
      const declaredLength = Number(response.headers["content-length"] ?? "");
      if (Number.isFinite(declaredLength) && declaredLength > MAX_EXTERNAL_RESPONSE_BYTES) {
        response.destroy();
        reject(new Error("External response is too large."));
        return;
      }

      const chunks: Buffer[] = [];
      let total = 0;
      response.on("data", (chunk) => {
        const buffer = Buffer.from(chunk);
        total += buffer.length;
        if (total > MAX_EXTERNAL_RESPONSE_BYTES) {
          response.destroy();
          reject(new Error("External response is too large."));
          return;
        }
        chunks.push(buffer);
      });
      response.on("end", () => resolve(new Response(Buffer.concat(chunks, total), {
        status: response.statusCode ?? 0,
        statusText: response.statusMessage ?? "",
        headers: response.headers as Record<string, string>,
      })));
      response.on("error", reject);
    };
    const request = url.protocol === "https:"
      ? https.request(requestOptions, handleResponse)
      : http.request(requestOptions, handleResponse);
    request.on("error", reject);
    if (body) request.write(body);
    request.end();
  });
}
