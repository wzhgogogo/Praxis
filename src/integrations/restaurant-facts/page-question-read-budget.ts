import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";

export interface QuestionPageVisits { used: number; limit: number; exhausted: boolean; }

/** Counts document visits across all sessions of one question; the original Guard stays installed. */
export function pageQuestionRuntime(runtime: BrowserRuntime, visits: QuestionPageVisits): BrowserRuntime {
  return {
    ...(runtime.readNetworkBoundaryCapability ? {readNetworkBoundaryCapability:runtime.readNetworkBoundaryCapability} : {}),
    async openSession(input) {
      const session = await runtime.openSession(input);
      return new Proxy(session, {
        get(target, key) {
          const value = Reflect.get(target, key, target);
          if (typeof value !== "function") return value;
          if (key !== "navigate" && key !== "openLink") return value.bind(target);
          return async (...args: unknown[]) => {
            input.signal.throwIfAborted();
            if (visits.used >= visits.limit) {
              visits.exhausted = true;
              throw Object.assign(new Error("Question page-visit ceiling reached"), {code:"QUESTION_PAGE_BUDGET_EXHAUSTED"});
            }
            visits.used++;
            return value.apply(target, args);
          };
        },
      });
    },
  };
}
