import type { Connector } from "./types";

const connectors = new Map<string, Connector>();

export function registerConnector(connector: Connector) {
  connectors.set(connector.provider, connector);
}

export function getConnector(provider: string): Connector | undefined {
  return connectors.get(provider);
}

export function getRegisteredConnectors(): Connector[] {
  return Array.from(connectors.values());
}