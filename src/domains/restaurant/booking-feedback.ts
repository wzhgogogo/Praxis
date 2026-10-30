/** User interaction receipts, never a provider-confirmed booking or Task Outcome. */
export type BookingFeedbackAnswer = "YES" | "NO" | "SKIP";
export interface BookingDepartureReceipt {
  id: string;
  caseId: string;
  candidateId: string;
  offerId: string;
  provider: "TABELOG" | "TABLECHECK";
  departedAt: string;
  promptedAt?: string;
  answer?: BookingFeedbackAnswer;
  answeredAt?: string;
  provenance: "USER_REPORTED";
}
export interface BookingFeedbackPrompt {
  departure: BookingDepartureReceipt;
  question: "Did you get the booking?";
  options: readonly ["YES", "NO", "SKIP"];
}
