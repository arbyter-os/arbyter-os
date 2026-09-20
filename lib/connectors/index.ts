import { registerConnector } from "./registry.ts";
import { agentMailConnector } from "./agentmail.ts";

let initialized = false;

export function initializeConnectors() {
  if (initialized) {
    return;
  }

  registerConnector(agentMailConnector);

  initialized = true;
}
