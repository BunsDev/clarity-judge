import type { JevErrorPayload } from "@/types/jev";

/**
 * Turn an error payload into something a person can act on:
 * what happened, why, and what to do next. Raw details stay available
 * separately for debugging.
 */
export type ErrorAction = { label: string; href?: string; kind: "retry" | "link" | "change-key" };

export type ErrorExplanation = {
  title: string;
  detail: string;
  actions: ErrorAction[];
};

const BILLING_URL = "https://console.typesafe.ai/settings/billing";

export function explainError(error: JevErrorPayload): ErrorExplanation {
  switch (error.code) {
    case "billing":
      return {
        title: "Your TypeSafe account has no credits",
        detail:
          "The API key is valid, but the organization it belongs to has no API credits, so Jev refused the request. Add credits (or turn on auto-reload), then run again.",
        actions: [
          { label: "Add credits", href: BILLING_URL, kind: "link" },
          { label: "Retry", kind: "retry" },
        ],
      };
    case "auth":
      return {
        title: "TypeSafe rejected the API key",
        detail:
          "The key that was sent is not valid. A key saved in this browser takes precedence over the server's key, so check that one first. Keys start with apikey_.",
        actions: [
          { label: "Change key", kind: "change-key" },
          { label: "Retry", kind: "retry" },
        ],
      };
    case "rate_limited":
      return {
        title: "Rate limit reached",
        detail: "TypeSafe is throttling requests from this key for a moment. Wait a few seconds and try again.",
        actions: [{ label: "Retry", kind: "retry" }],
      };
    case "overloaded":
      return {
        title: "TypeSafe is overloaded",
        detail: "The service is busy right now and turned the request away. This usually clears within a minute.",
        actions: [{ label: "Retry", kind: "retry" }],
      };
    case "timeout":
      return {
        title: "The request timed out",
        detail: "Jev didn't answer in time. Long texts take longer; try again, or trim the text.",
        actions: [{ label: "Retry", kind: "retry" }],
      };
    case "network":
      return {
        title: "Couldn't reach the server",
        detail: "The request never got through. Check your connection, and that the dev server is still running.",
        actions: [{ label: "Retry", kind: "retry" }],
      };
    case "validation":
      return {
        title: "Nothing was sent",
        detail: error.error,
        actions: [],
      };
    case "bad_response":
      return {
        title: "Unexpected reply",
        detail: "The response wasn't in the shape the app expects. The raw reply is below.",
        actions: [{ label: "Retry", kind: "retry" }],
      };
    default:
      return {
        title: "Something went wrong",
        detail: error.error,
        actions: [{ label: "Retry", kind: "retry" }],
      };
  }
}
