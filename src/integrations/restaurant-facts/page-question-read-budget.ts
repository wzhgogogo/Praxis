import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";

export interface QuestionPageVisits { used: number; limit: number; exhausted: boolean; }

/** Counts document visits across all sessions of one question; the original Guard stays installed. */
export function pageQuestionRuntime(runtime: BrowserRuntime, visits?: QuestionPageVisits, beforeRead?:()=>void): BrowserRuntime {
  return {
    ...(runtime.readNetworkBoundaryCapability ? {readNetworkBoundaryCapability:runtime.readNetworkBoundaryCapability} : {}),
    async openSession(input) {
      beforeRead?.();
      const session = await runtime.openSession(input);
      return new Proxy(session, {
        get(target, key) {
          const value = Reflect.get(target, key, target);
          if (typeof value !== "function") return value;
          const visit=key==="navigate"||key==="openLink";
          if(key==="close"||!beforeRead&&!visit)return value.bind(target);
          return async (...args: unknown[]) => {
            beforeRead?.();
            if(visit)input.signal.throwIfAborted();
            if (visit&&visits&&visits.used >= visits.limit) {
              visits.exhausted = true;
              throw Object.assign(new Error("Question page-visit ceiling reached"), {code:"QUESTION_PAGE_BUDGET_EXHAUSTED"});
            }
            if(visit&&visits)visits.used++;
            return value.apply(target, args);
          };
        },
      });
    },
  };
}
