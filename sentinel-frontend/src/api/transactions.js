import { apiPost } from "./client";

/**
 * Submits a transaction to the real Sentinel risk engine.
 * Contract is FROZEN — do not rename fields, do not change the path.
 * POST /api/transactions -> { fusion, rules, ml, explanation }
 */
export function analyzeTransaction(transaction) {
  return apiPost("/transactions", transaction);
}

/*
 * ---- Phase 2 (not implemented — backend does not expose these yet) ----
 * These are intentionally left as documented stubs so pages can be wired
 * up later without any redesign. Calling them today will 404 against the
 * current frozen backend, so nothing calls them yet.
 *
 * export function getTransactionHistory(params) {
 *   return apiGet(`/transactions?${new URLSearchParams(params)}`);
 * }
 *
 * export function getUserRisk(userId) {
 *   return apiGet(`/users/${userId}/risk`);
 * }
 *
 * export function getModelInfo() {
 *   return apiGet("/model/info");
 * }
 *
 * export function getModelMetrics() {
 *   return apiGet("/model/metrics");
 * }
 */
