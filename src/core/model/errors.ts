import type { ModelProviderErrorDiagnostic } from "./contracts.js";

export type ModelGatewayErrorCode =
  | "CONFIGURATION"
  | "INVALID_REQUEST"
  | "TIMEOUT"
  | "NETWORK"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_REJECTED"
  | "MALFORMED_RESPONSE";

export class ModelGatewayError extends Error {
  constructor(
    message: string,
    readonly code: ModelGatewayErrorCode,
    readonly retryable: boolean,
    readonly providerStatus?: number,
    readonly providerRequestId?: string,
    readonly providerError?: ModelProviderErrorDiagnostic,
  ) {
    super(message);
    this.name = "ModelGatewayError";
  }
}
