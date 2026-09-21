import { createAdminClient } from "@/lib/supabase/admin";

type ProcessFindingInput = {
  organizationId: string;
  scanId: string;
  sourceId: string;

  name: string;
  description?: string;

  provider?: string;
  framework?: string;
  environment?: string;
  endpoint?: string;

  tools?: unknown[];
  capabilities?: unknown;
  evidence?: unknown;
  rawMetadata?: unknown;
};

function calculateClassification(input: ProcessFindingInput) {
  const toolCount = input.tools?.length ?? 0;

  let confidence = 20;

  if (toolCount > 0) {
    confidence += 35;
  }

  if (input.framework) {
    confidence += 20;
  }

  if (input.provider) {
    confidence += 10;
  }

  if (input.endpoint) {
    confidence += 10;
  }

  confidence = Math.min(confidence, 100);

  if (toolCount > 0 && confidence >= 70) {
    return {
      classification: "confirmed_agent",
      confidence,
    };
  }

  if (confidence >= 45) {
    return {
      classification: "likely_agent",
      confidence,
    };
  }

  return {
    classification: "unknown",
    confidence,
  };
}

export async function processDiscoveryFinding(
  input: ProcessFindingInput
) {
  const supabase = createAdminClient();

  const {
    classification,
    confidence,
  } = calculateClassification(input);

  const fingerprint = createFingerprint({
    provider: input.provider,
    framework: input.framework,
    endpoint: input.endpoint,
    name: input.name,
  });

  const { data: existing } = await supabase
    .from("discovery_findings")
    .select("id, duplicate_of, review_status")
    .eq("organization_id", input.organizationId)
    .eq("fingerprint", fingerprint)
    .neq("review_status", "rejected")
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      success: true,
      duplicate: true,
      findingId: existing.id,
    };
  }

  const { data, error } = await supabase
    .from("discovery_findings")
    .insert({
      organization_id: input.organizationId,
      scan_id: input.scanId,
      source_id: input.sourceId,

      fingerprint,

      name: input.name,
      description: input.description ?? null,

      classification,
      confidence,

      provider: input.provider ?? null,
      framework: input.framework ?? null,
      environment: input.environment ?? "unknown",

      endpoint: input.endpoint ?? null,

      tools: input.tools ?? [],
      capabilities: input.capabilities ?? {},
      data_access: {},
      evidence: input.evidence ?? {},
      raw_metadata: input.rawMetadata ?? {},

      review_status: "unreviewed",
      onboarding_status: "not_onboarded",

      discovered_at: new Date().toISOString(),
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .select("id, classification, confidence")
    .single();

  if (error) {
    throw error;
  }

  return {
    success: true,
    duplicate: false,
    findingId: data.id,
    classification: data.classification,
    confidence: data.confidence,
  };
}

function createFingerprint(input: {
  provider?: string;
  framework?: string;
  endpoint?: string;
  name: string;
}) {
  return [
    input.provider ?? "",
    input.framework ?? "",
    input.endpoint ?? "",
    input.name,
  ]
    .join("|")
    .toLowerCase()
    .trim();
}