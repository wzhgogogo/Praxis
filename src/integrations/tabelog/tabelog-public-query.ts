import type { BrowserReadNetworkPolicy } from "../../infrastructure/browser/browser-runtime.js";

/** Public Tabelog read shapes captured on 2026-10-07; values remain browser-private. */
export const tabelogPublicReadNetworkPolicy: BrowserReadNetworkPolicy = {
  documentOrigins: ["https://tabelog.com"],
  staticResources: [
    {
      origin: "https://tblg.k-img.com",
      pathnamePrefix: "/javascripts/",
      resourceTypes: ["script"],
      queryKeyRules: { required: [], allowedPatterns: ["^rst-v1-[A-Za-z0-9._-]+$"] },
    },
    {
      origin: "https://tblg.k-img.com",
      pathnamePrefix: "/stylesheets/",
      resourceTypes: ["stylesheet"],
      queryKeyRules: { required: [], allowedPatterns: ["^rst-v1-[A-Za-z0-9._-]+$"] },
    },
    {
      origin: "https://tblg.k-img.com",
      pathnamePrefix: "/images/",
      resourceTypes: ["image"],
      queryKeyRules: { required: [], allowedPatterns: ["^[a-f0-9]{64}$"] },
    },
    {
      origin: "https://tblg.k-img.com",
      pathnamePrefix: "/restaurant/images/",
      resourceTypes: ["image"],
      queryKeyRules: { required: [], allowedPatterns: ["^[a-f0-9]{64}$"] },
    },
  ],
  dynamicReads: [
    {
      // Public directory documents use `sw` as the observed search
      // expression.  This Pack-owned grammar lets Recorder preserve a
      // current query URL without admitting arbitrary document fields.
      origin: "https://tabelog.com",
      pathnamePrefix: "/en/tokyo/",
      resourceTypes: ["document"],
      methods: ["GET"],
      queryKeyRules: { required: [], allowed: ["sw"] },
    },
    {
      // Captured on a public detail page before the calendar controls hydrate.
      // This only admits the source's bootstrap read; it establishes no slot.
      origin: "https://tabelog.com",
      pathname: "/en/booking/calendar/initial_vacancy",
      resourceTypes: ["fetch"],
      methods: ["GET"],
      queryKeyRules: { required: ["rst_id"], allowed: ["plan_id", "seat_only", "exclude_unavailable_time"] },
    },
    {
      origin: "https://tabelog.com",
      pathname: "/en/booking/calendar/find_vacancy_date_with_status/",
      resourceTypes: ["xhr"],
      methods: ["GET"],
      queryKeyRules: { required: ["rst_id"], allowed: ["plan_id", "seat_only"] },
    },
    {
      origin: "https://tabelog.com",
      pathname: "/en/booking/calendar/find_vacancy_member_by_date/",
      resourceTypes: ["xhr"],
      methods: ["GET"],
      queryKeyRules: { required: ["rst_id", "svd"], allowed: ["plan_id", "seat_only"] },
    },
    {
      origin: "https://tabelog.com",
      pathname: "/en/booking/calendar/find_vacancy/",
      resourceTypes: ["xhr"],
      methods: ["GET"],
      queryKeyRules: { required: ["rst_id", "svd", "svps"], allowed: ["svt", "plan_id", "seat_only", "exclude_unavailable_time"] },
    },
    {
      origin: "https://tabelog.com",
      pathname: "/contents/reserve_date_status_list",
      resourceTypes: ["xhr"],
      queryKeyRules: { required: ["inbound_flag", "rst_id_list[]"], repeatable: ["rst_id_list[]"] },
    },
  ],
};
