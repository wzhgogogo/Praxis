import { AsyncLocalStorage } from "node:async_hooks";
import type { ModelGateway, ModelRequest, ModelResponse } from "../core/model/contracts.js";

/** One shared transport for Agent decisions and their bounded provider reads. */
export class DeliveryReservedModelGateway implements ModelGateway {
  private readonly reads = new AsyncLocalStorage<{ remaining: () => number | undefined; qualified: () => boolean; reached: boolean }>();
  constructor(private readonly delegate: ModelGateway) {}

  runRead<T>(remaining: () => number | undefined, qualified: () => boolean, work: () => Promise<T>): Promise<T> {
    const scope = { remaining, qualified, reached: false };
    return this.reads.run(scope, async () => {
      try {
        return await work();
      } finally {
        // A source may catch transport errors. Preserve the reason at the
        // Router boundary instead of accepting an incomplete read as success.
        if (scope.reached) throw this.reserveError();
      }
    });
  }

  complete(request: ModelRequest): Promise<ModelResponse> {
    const scope = this.reads.getStore();
    const remaining = scope?.remaining();
    if (scope && remaining !== undefined && Number.isSafeInteger(remaining) && remaining >= 0 && remaining <= 4 && scope.qualified()) {
      scope.reached = true;
      return Promise.reject(this.reserveError());
    }
    return this.delegate.complete(request);
  }

  private reserveError(): Error & { code: string } {
    return Object.assign(new Error("BUDGET_RESERVED_FOR_DELIVERY: source read stopped to preserve four model calls for qualified delivery or truthful no-result ending"), { code: "BUDGET_RESERVED_FOR_DELIVERY" });
  }
}
