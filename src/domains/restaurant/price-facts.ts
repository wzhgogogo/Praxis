/** Public, source-quoted prices. Listed plans do not establish plan inventory. */
export interface RestaurantQuotedBudget {
  min: number;
  max: number;
  quote: string;
  sourceUrl: string;
}
export interface RestaurantQuotedCoursePrice {
  amount: number;
  tax: "INCLUDED" | "EXCLUDED" | "UNSPECIFIED";
  meal: "LUNCH" | "DINNER" | "UNSPECIFIED";
  kind: "MEAL" | "ADD_ON" | "UNSPECIFIED";
  quote: string;
  sourceUrl: string;
}
export interface RestaurantPriceFacts {
  schemaVersion: "restaurant-price-facts@1";
  dinnerBudgetRangeYen?: RestaurantQuotedBudget;
  lunchBudgetRangeYen?: RestaurantQuotedBudget;
  listedCoursePricesYen: RestaurantQuotedCoursePrice[];
}
