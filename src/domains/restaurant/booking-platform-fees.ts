/** Fixed source policy, scoped solely to Tabelog's English booking entrance. */
export const TABELOG_ENGLISH_SYSTEM_FEE = {
  provider: "TABELOG", channel: "ENGLISH_BOOKING", amountPerPersonJPY: 440,
  userCancellationRefund: false, restaurantCancellationRefund: true,
  label: "System usage fee: ¥440 per guest; not refunded if you cancel. Refunded if the restaurant cancels.",
  sourceUrl: "https://tabelog.com/en/help", checkedOn: "2026-10-29",
  documentSHA256: "f8d3583945fb819636854582432a10109a0d782cc2314b7088ccfa9cc2fc4b51",
  quotes: [
    "Tabelog charges a system usage fee of JPY 440 per person* at the time of reservation.",
    "Please note that no refunds will be issued for cancellations made for customer reasons.",
    "However, if a restaurant initiates a cancellation, the system usage fee for that reservation will be refunded.",
  ],
} as const;
