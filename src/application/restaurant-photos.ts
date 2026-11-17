import type { RestaurantCaseView } from "./agent-workspace.js";

/** Presentation only. Photos never establish restaurant facts or availability. */
export interface RestaurantPhoto {
  id: string;
  contentUrl: string;
  sourcePageUrl?: string;
  provider?: "GOOGLE_PLACES" | "WEBSITE";
  authors?: Array<{displayName:string; uri?:string}>;
  sourceLabel: string;
  attribution?: string;
  width?: number;
  height?: number;
}

export interface RestaurantPhotos {
  candidateId: string;
  status: "READY" | "EMPTY" | "UNAVAILABLE";
  photos: RestaurantPhoto[];
  expiresAt: string;
  reasonCode?: string;
  requests?: {googleDetails:number;googleMedia:number;websitePages:number;websiteImages:number};
}

export interface RestaurantPhotosPort {
  read(view: RestaurantCaseView, candidateId: string, scope: "cover" | "gallery", signal: AbortSignal, failedCoverId?: string): Promise<RestaurantPhotos>;
  content(view: RestaurantCaseView, candidateId: string, photoId: string, signal: AbortSignal): Promise<{ body: Uint8Array; contentType: "image/webp" | "image/jpeg" | "image/png" } | undefined>;
}
