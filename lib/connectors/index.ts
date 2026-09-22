import { registerConnector } from "./registry";
import { agentMailConnector } from "./agentmail";

let initialized = false;

export function initializeConnectors() {
  if (initialized) {
    return;
  }

  registerConnector(agentMailConnector);

  initialized = true;
}