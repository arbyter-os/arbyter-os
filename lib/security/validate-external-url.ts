import dns from "node:dns/promises";
import net from "node:net";

export type ExternalUrlValidationOptions = {
  protocols: string[];
};

export type ExternalUrlValidationResult =
  | { valid: true; url: URL; addresses: string[] }
  | { valid: false; error: string };

function ipv4ToNumber(address: string): number {
  return address
    .split(".")
    .map(Number)
    .reduce((value, octet) => value * 256 + octet, 0);
}

function ipv4InRange(
  address: string,
  start: string,
  end: string,
): boolean {
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
    address === "192.88.99.0" ||
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
    if (net.isIPv4(ipv4) !== 4) return null;
    const numeric = ipv4ToNumber(ipv4);
    value = `${value.slice(0, lastColon)}:${
      (numeric >>> 16).toString(16)
    }:${(numeric & 0xffff).toString(16)}`;
  }

  const parts = value.split("::");
  if (parts.length > 2) return null;

  const left = parts[0] ? parts[0].split(":") : [];
  const right = parts[1] ? parts[1].split(":") : [];

  if (left.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  if (right.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;

  const groups =
    parts.length === 2
      ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
      : left;

  if (groups.length !== 8) return null;

  return groups.reduce(
    (result, group) => (result << 16n) | BigInt(parseInt(group, 16)),
    0n,
  );
}

function ipv6InRange(address: bigint, prefix: bigint, bits: number): boolean {
  const shift = 128n - BigInt(bits);
  return (address >> shift) === (prefix >> shift);
}

function isUnsafeIpv6(address: string): boolean {
  const parsed = parseIpv6(address);
  if (parsed === null) return true;

  const ranges: Array<[string, number]> = [
    ["::", 128],
    ["::1", 128],
    ["::ffff:0:0", 96],
    ["100::", 64],
    ["2001:2::", 48],
    ["2001:10::", 28],
    ["2001:db8::", 32],
    ["2001::", 32],
    ["fc00::", 7],
    ["fe80::", 10],
    ["ff00::", 8],
  ];

  return ranges.some(([prefix, bits]) => {
    const parsedPrefix = parseIpv6(prefix);
    return parsedPrefix !== null && ipv6InRange(parsed, parsedPrefix, bits);
  });
}

function isUnsafeAddress(address: string): boolean {
  if (net.isIPv4(address) === 4) return isUnsafeIpv4(address);
  if (net.isIPv6(address) === 6) return isUnsafeIpv6(address);
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
    return {
      valid: false,
      error: `URL must use ${options.protocols.join(" or ")}.`,
    };
  }

  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: "URLs cannot contain embedded credentials.",
    };
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
    return {
      valid: false,
      error: "The endpoint hostname could not be resolved.",
    };
  }

  if (!addresses.length || addresses.some(isUnsafeAddress)) {
    return {
      valid: false,
      error: "Private, local, reserved, or otherwise unsafe network endpoints cannot be accessed.",
    };
  }

  return { valid: true, url: parsed, addresses };
}
