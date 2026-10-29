// Offline transport only, constructed 2026-10-29. Chooses visible statement IDs;
// numeric oracles stay in each test, independent of this scripted selection.
import type { ModelGateway } from "../../../core/model/contracts.js";
import { decodeHTML } from "entities";
export function fragmentVisibleText(html: string): string {
  return decodeHTML(html.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/giu, "")
    .replace(/<\/(?:div|section|article|p|h[1-6]|dl|dt|dd|tr|li)>|<br\s*\/?\s*>/giu, "\n")
    .replace(/<[^>]+>/gu, "")).split("\n").map(line=>line.replace(/\s+/gu," ").trim()).filter(Boolean).join("\n");
}
export const quotedMenuFixtureModel: ModelGateway = { async complete(request) {
  if(request.purpose!=="restaurant_source_facts")throw Error("Unexpected fixture model purpose");
  const wire=JSON.parse(request.messages[1]!.content);
  const rows=wire.sourceDocument.statements as Array<{id:string;text:string}>;
  let first=0; const usedRegions=new Set<number>();
  const selections=rows.flatMap((row,index)=>{
    if(!/(?:JPY|[¥￥])\s*\d|\d[\d,]*\s*円/u.test(row.text))return [];
    let role="COURSE";
    if(/(?:JPY|[¥￥]).*[-–〜～].*(?:JPY|[¥￥])/u.test(row.text)){
      const regions=wire.labelledRegions as Array<{label:string;text:string}>;
      const region=regions.findIndex((region,i)=>!usedRegions.has(i)&&region.text.replace(/\s+/gu," ").trim()===row.text);
      if(region>=0){usedRegions.add(region);role=regions[region]!.label.toLowerCase()==="dinner"?"DINNER_BUDGET":"LUNCH_BUDGET";}
    }
    const from=role==="COURSE"?first:index;
    const last=role==="COURSE"&&/Number of people/iu.test(rows[index+1]?.text??"") ? index+2 : index;
    first=last+1;
    return [{firstStatementId:rows[from]!.id,lastStatementId:rows[last]!.id,priceStatementId:row.id,role}];
  });
  return {invocationId:"visible-quotation-fixture",provider:"FIXTURE",model:"fixture",finishReason:"TOOL_CALLS",latencyMs:0,outputText:JSON.stringify({selections})};
} };
