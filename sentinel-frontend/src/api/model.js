import { apiGet } from "./client";

/**
 * Fetches real model telemetry from the backend.
 * GET /api/model/telemetry -> { liveArtifactMetadata, heldOutTestEvaluation,
 *   globalFeatureImportance, businessImpact, runtimeTelemetry }
 *
 * liveArtifactMetadata is derived live from the deployed model artifact
 * on disk. heldOutTestEvaluation, globalFeatureImportance, and
 * businessImpact are verified offline evaluation results (see backend
 * src/modelTelemetry.js for full provenance) — not calculated per
 * request. runtimeTelemetry contains live backend process counters
 * (transaction outcome counts, request stats, latency, service
 * availability) and IS updated per request/poll, unlike the other
 * sections.
 */
export function getModelTelemetry() {
  return apiGet("/model/telemetry");
}
