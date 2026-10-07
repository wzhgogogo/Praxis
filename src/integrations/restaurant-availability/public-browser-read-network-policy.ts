import type { BrowserReadNetworkPolicy } from "../../infrastructure/browser/browser-runtime.js";
import { tableCheckPublicReadNetworkPolicy } from "../tablecheck/tablecheck-public-query.js";
import { tabelogPublicReadNetworkPolicy } from "../tabelog/tabelog-public-query.js";

/** The one guarded browser session may inspect either discovered public source. */
export const restaurantPublicReadNetworkPolicy: BrowserReadNetworkPolicy = {
  documentOrigins: [...tableCheckPublicReadNetworkPolicy.documentOrigins, ...tabelogPublicReadNetworkPolicy.documentOrigins],
  staticResources: [...tableCheckPublicReadNetworkPolicy.staticResources, ...tabelogPublicReadNetworkPolicy.staticResources],
  dynamicReads: [...tableCheckPublicReadNetworkPolicy.dynamicReads, ...tabelogPublicReadNetworkPolicy.dynamicReads],
};
