/** Literal eligibility constraints on a quoted price, never plan inventory. */
export interface QuotedPriceRequest {
  date?: string | undefined;
  partySize?: number | undefined;
  meal?: "LUNCH" | "DINNER";
}
export interface QuotedPriceApplicability {
  status: "APPLICABLE" | "INAPPLICABLE" | "UNVERIFIED";
  reasons: string[];
}
const dateToken = String.raw`(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?`;
const dayToken = String.raw`\b(?:mon(?:day)?s?|tue(?:sday)?s?|wed(?:nesday)?s?|thu(?:rsday)?s?|fri(?:day)?s?|sat(?:urday)?s?|sun(?:day)?s?)\b`;
const dayNumbers: Record<string, number> = {sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6};
function isoDate(year: string, month: string, day: string): string | undefined {
  const value = `${year}-${month.padStart(2,"0")}-${day.padStart(2,"0")}`;
  const instant = new Date(value + "T00:00:00Z");
  return Number.isFinite(instant.valueOf()) && instant.toISOString().slice(0,10) === value ? value : undefined;
}

/** Unsupported or ambiguous conditions remain unverified; no inferred limits. */
export function quotedPriceApplicability(quote: string, request: QuotedPriceRequest): QuotedPriceApplicability {
  let remaining = quote.normalize("NFKC").toLowerCase();
  let unknown = false, inapplicable = false;
  const reasons: string[] = [];
  const check = (literal: string, result: boolean | undefined) => {
    if (result === undefined) unknown = true;
    else if (!result) inapplicable = true;
    reasons.push(`${result === undefined ? "UNVERIFIED" : result ? "APPLICABLE" : "INAPPLICABLE"}: ${literal}`);
  };
  const consume = (pattern: RegExp, verify: (match: RegExpExecArray) => boolean | undefined) => {
    remaining = remaining.replace(pattern, (...args) => {
      const match = args.slice(0,-2) as RegExpExecArray;
      check(match[0],verify(match)); return " ";
    });
  };
  const party = (minimum: number, maximum: number) => Number.isSafeInteger(request.partySize) && request.partySize! > 0
    ? request.partySize! >= minimum && request.partySize! <= maximum : undefined;
  const prefix = String.raw`(?:(?:available|valid|offered)\s+)?(?:only\s+)?(?:for\s+)?`;
  consume(new RegExp(prefix+String.raw`(?:number of (?:people|guests)|party size|利用人数|ご利用人数|人数)\s*[:：]?\s*(\d+)\s*[-–~〜～]\s*(\d+)\s*(?:名様?|人|people|persons?|guests)?(?:\s*only|限定)?`,"gu"),
    m => Number(m[1]) <= Number(m[2]) ? party(Number(m[1]),Number(m[2])) : undefined);
  consume(new RegExp(prefix+String.raw`(?:parties|groups) of\s+(\d+)\s*(?:to|[-–~〜～])\s*(\d+)(?:\s*(?:people|persons?|guests))?(?:\s*only)?`,"gu"),
    m => Number(m[1]) <= Number(m[2]) ? party(Number(m[1]),Number(m[2])) : undefined);
  consume(new RegExp(prefix+String.raw`(?:parties|groups) of\s+(\d+)\s+or more(?:\s*only)?`,"gu"),m=>party(Number(m[1]),Infinity));
  consume(new RegExp(prefix+String.raw`(?:parties|groups) of\s+(\d+)\s+or (?:fewer|less)(?:\s*only)?`,"gu"),m=>party(1,Number(m[1])));
  consume(new RegExp(prefix+String.raw`(?:parties|groups) of\s+at least\s+(\d+)`,"gu"),m=>party(Number(m[1]),Infinity));
  consume(new RegExp(prefix+String.raw`(?:at least|minimum|min\.?)\s*(\d+)\s*(?:people|persons?|guests)(?:\s*only)?`,"gu"),m=>party(Number(m[1]),Infinity));
  consume(new RegExp(prefix+String.raw`(?:up to|at most|maximum|max\.?)\s*(\d+)\s*(?:people|persons?|guests)(?:\s*only)?`,"gu"),m=>party(1,Number(m[1])));
  consume(/(\d+)\s*(?:名様?|人)以上(?:限定|から)?/gu,m=>party(Number(m[1]),Infinity));
  consume(/(\d+)\s*(?:名様?|人)以下(?:限定|まで)?/gu,m=>party(1,Number(m[1])));
  consume(new RegExp(prefix+String.raw`(?:parties|groups) of\s+(\d+)(?:\s*(?:people|persons?|guests))?(?:\s*only)?`,"gu"),m=>party(Number(m[1]),Number(m[1])));

  const date = request.date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const requestDate = date && isoDate(date[1]!,date[2]!,date[3]!);
  const datePrefix = String.raw`(?:(?:valid|available|offered)(?:\s+dates?)?\s*:?\s*|(?:利用期間|予約可能日|利用可能日|期間)\s*[:：]?\s*)?`;
  consume(new RegExp(datePrefix+String.raw`(?:from\s*)?`+dateToken+String.raw`\s*(?:to|through|until|[-–~〜～])\s*`+dateToken+String.raw`(?:\s*only|限定)?`,"gu"),m=>{
    const from=isoDate(m[1]!,m[2]!,m[3]!),to=isoDate(m[4]!,m[5]!,m[6]!);
    return requestDate && from && to && from<=to ? requestDate>=from && requestDate<=to : undefined;
  });
  consume(new RegExp(datePrefix+String.raw`(?:on\s*)?`+dateToken+String.raw`(?:\s*only|限定)?`,"gu"),m=>{
    const day=isoDate(m[1]!,m[2]!,m[3]!);return requestDate && day ? requestDate===day : undefined;
  });

  consume(/(?:(?:available|served|offered)\s+(?:for\s+)?)?(lunch|dinner)\s*only\b/gu,m=>request.meal ? request.meal===m[1]!.toUpperCase() : undefined);
  consume(/(ランチ|昼食|ディナー|夕食)(?:限定|のみ)/gu,m=>request.meal ? request.meal===(/ランチ|昼食/u.test(m[1]!)?"LUNCH":"DINNER") : undefined);
  const weekday = requestDate ? new Date(requestDate+"T00:00:00Z").getUTCDay() : undefined;
  consume(new RegExp(String.raw`(?:(not available|unavailable|except)\s+(?:on\s+)?)?(?:(?:available|valid|offered)\s+)?(?:only\s+)?(?:on\s+)?(`+dayToken+String.raw`(?:\s*(?:,\s*(?:and\s+)?|and\s+|to\s+|through\s+|[-–/]\s*)`+dayToken+String.raw`)*)(?:\s*only)?\b`,"gu"),m=>{
    const tokens=[...m[2]!.matchAll(new RegExp(dayToken,"gu"))].map(day=>dayNumbers[day[0].slice(0,3)]!);
    let days=tokens;
    if(tokens.length===2 && /\bto\b|\bthrough\b|[-–]/u.test(m[2]!)){
      days=[];for(let day=tokens[0]!;;day=(day+1)%7){days.push(day);if(day===tokens[1])break;}
    }
    return weekday===undefined ? undefined : m[1] ? !days.includes(weekday) : days.includes(weekday);
  });
  consume(/(?:毎週)?([日月火水木金土])(?:曜日|曜)(?:限定|のみ)?/gu,m=>weekday===undefined ? undefined : weekday==="日月火水木金土".indexOf(m[1]!));
  consume(/(?:available\s+)?weekdays?(?:\s*only)?/gu,()=>weekday===undefined ? undefined : weekday>=1&&weekday<=5);
  consume(/(?:available\s+)?weekends?(?:\s*only)?/gu,()=>weekday===undefined ? undefined : weekday===0||weekday===6);
  // Menu composition and quoted tax are retained, not eligibility conditions.
  remaining=remaining.replace(/tax\s+not\s+included|not\s+including\s+tax|(?:food|meal)\s+only|only\s+(?=(?:jpy|¥)\s*\d)/gu," ");
  const unsupported = /\b(?:only|not)\b|\b(?:minimum|maximum|limited|exclusive|members?|students?|adults?|children|women|men|registered|holidays?|except|conditions?|restrictions?|required|must|deadline)\b|(?:valid|available)\s+(?:from|until|between|for|on|through)|advance\s+(?:reservation|booking)|(?:reservation|booking)\s+in advance|(?:people|persons?|guests|diners|participants)\s*\d|\d\s*(?:people|persons?|guests|diners|participants)|for\s+[^.!?\n]{0,50}\b(?:people|persons?|guests|diners|participants|couples?)\b|人数|名様|限定|利用期間|予約可能日|条件|要予約|祝日|平日|限り|除く|まで|から/iu;
  if(unsupported.test(remaining))check(remaining.trim(),undefined);
  return {status:inapplicable?"INAPPLICABLE":unknown?"UNVERIFIED":"APPLICABLE",reasons};
}
