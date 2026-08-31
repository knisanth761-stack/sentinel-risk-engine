/* eslint-disable react-refresh/only-export-components -- this module
   intentionally exports the provider, the `presets` constant, and the
   `useSessionHistory` hook together; splitting them would scatter one
   cohesive piece of session state across three files for no benefit. */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { analyzeTransaction } from "../api/transactions";
import {
  extractDecision,
  extractExplanation,
  extractFusion,
  extractMlProbability,
  extractReasons,
  extractRuleScore,
  extractRules,
  extractScore,
  extractTopFeatures,
  summarizeHistory,
} from "../lib/risk";

const NUMERIC_FIELDS = [
  "amount",
  "step",
  "oldbalanceOrg",
  "newbalanceOrig",
  "oldbalanceDest",
  "newbalanceDest",
];

const initialTransaction = {
  transactionId: `TX-${Date.now()}`,
  userId: "demo-user-001",
  amount: 1000,
  currency: "USD",
  step: 600,
  oldbalanceOrg: 10000,
  newbalanceOrig: 9000,
  oldbalanceDest: 5000,
  newbalanceDest: 6000,
  type: "PAYMENT",
};

export const presets = {
  normal: {
    amount: 1000,
    oldbalanceOrg: 10000,
    newbalanceOrig: 9000,
    oldbalanceDest: 5000,
    newbalanceDest: 6000,
    type: "PAYMENT",
  },
  suspicious: {
    amount: 50000,
    oldbalanceOrg: 60000,
    newbalanceOrig: 10000,
    oldbalanceDest: 1000,
    newbalanceDest: 51000,
    type: "TRANSFER",
  },
  fraud: {
    amount: 1000000,
    oldbalanceOrg: 1000000,
    newbalanceOrig: 0,
    oldbalanceDest: 0,
    newbalanceDest: 1000000,
    type: "TRANSFER",
  },
};

const SessionHistoryContext = createContext(null);

export function SessionHistoryProvider({ children }) {
  const [transaction, setTransaction] = useState(initialTransaction);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRun, setLastRun] = useState(null);
  const [history, setHistory] = useState([]);

  const updateField = useCallback((field, value) => {
    setTransaction((current) => ({
      ...current,
      [field]: NUMERIC_FIELDS.includes(field) ? Number(value) : value,
    }));
  }, []);

  const applyPreset = useCallback((name) => {
    setTransaction((current) => ({
      ...current,
      ...presets[name],
      transactionId: `TX-${Date.now()}`,
    }));
    setResult(null);
    setError("");
  }, []);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await analyzeTransaction(transaction);
      setResult(data);
      const now = new Date();
      setLastRun(now);

      // Build a session-history entry purely from the real response —
      // no fabricated fields.
      const entry = {
        id: transaction.transactionId,
        timestamp: now,
        transaction: { ...transaction },
        result: data,
        decision: extractDecision(data),
        score: extractScore(data),
        ruleScore: extractRuleScore(data),
        mlProbability: extractMlProbability(data),
        reasons: extractReasons(data),
        topFeatures: extractTopFeatures(data),
        fusion: extractFusion(data),
        rules: extractRules(data),
        explanation: extractExplanation(data),
      };

      setHistory((current) => [entry, ...current]);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to reach Sentinel Risk Engine. Make sure the backend is running on port 3000."
      );
    } finally {
      setLoading(false);
    }
  }, [transaction]);

  const summary = useMemo(() => summarizeHistory(history), [history]);

  const value = useMemo(
    () => ({
      transaction,
      updateField,
      applyPreset,
      result,
      loading,
      error,
      lastRun,
      runAnalysis,
      history,
      summary,
    }),
    [transaction, updateField, applyPreset, result, loading, error, lastRun, runAnalysis, history, summary]
  );

  return <SessionHistoryContext.Provider value={value}>{children}</SessionHistoryContext.Provider>;
}

export function useSessionHistory() {
  const ctx = useContext(SessionHistoryContext);
  if (!ctx) {
    throw new Error("useSessionHistory must be used within a SessionHistoryProvider");
  }
  return ctx;
}
