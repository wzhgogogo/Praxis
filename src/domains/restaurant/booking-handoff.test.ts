import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { prepareBookingHandoff, presentBookingHandoff, type BookingHandoffContext, type BookingHandoffSource } from "./booking-handoff.js";

function fixture(): {context:BookingHandoffContext; source:BookingHandoffSource} {
  return JSON.parse(readFileSync(new URL("./fixtures/booking-handoff/source.json", import.meta.url), "utf8"));
}
function rendered(input=fixture()) {
  const prepared=prepareBookingHandoff(input.source,input.context);
  return prepared ? presentBookingHandoff(prepared,input.context) : undefined;
}
function tableCheck() {
  const input=fixture();
  input.context.candidate.restaurant.sourceIds={tablecheck:"fixture-sushi"};
  input.context.offer.source="TABLECHECK"; input.context.check.sourceProvider="TABLECHECK";
  input.context.evidence.forEach(e=>{e.provider="TABLECHECK";e.sourceEntityId="fixture-sushi";});
  input.source={...input.source,provider:"TABLECHECK",linkBasis:"VERIFIED_PARAMETERS",sourceEntityId:"fixture-sushi",
    url:"https://www.tablecheck.com/en/shops/fixture-sushi/reserve?start_date=2026-11-02&start_time=19%3A00&num_people=2",
    observedEntranceUrl:"https://www.tablecheck.com/en/shops/fixture-sushi/reserve"};
  delete input.source.terms;
  return input;
}

test("B1 source-returned Tabelog link has evidence-only copy and same-channel verbatim terms",()=>{
  const result=rendered()!; assert.ok(result);
  assert.equal(result.url,"https://tabelog.com/en/booking/form_course/new?rcd=13123456&member=2&visit_date=20261102&visit_time=1900");
  assert.equal(result.directLabel,"Book on Tabelog");
  assert.equal(result.continueLabel,"Continue on Tabelog — date, time, 2 guests filled in");
  assert.equal(result.selectionHint,"Pick Omakase Nigiri ¥9,800");
  assert.deepEqual(result.terms.map(t=>t.label),["Same-day cancellation costs 100%.","Card required"]);
  assert.equal(result.terms[0]!.citations[0]!.text,"Cancellations on the day cost 100%.");
  assert.equal(result.sourceSelection,"UNKNOWN");
  assert.deepEqual(result.linkCarries,["DATE","TIME","PARTY_SIZE"]);
  assert.doesNotMatch(JSON.stringify(result),/selected|booked|page\.text/i);
});

test("B1 verified TableCheck parameters carry the exact slot and always ask to check date and guests",()=>{
  const result=rendered(tableCheck())!; assert.ok(result);
  assert.equal(result.url,"https://www.tablecheck.com/en/shops/fixture-sushi/reserve?start_date=2026-11-02&start_time=19%3A00&num_people=2");
  assert.equal(result.continueLabel,"Continue on TableCheck — date, time, 2 guests filled in");
  assert.equal(result.verificationHint,"Check date and guests"); assert.equal(result.selectionHint,undefined); assert.deepEqual(result.terms,[]);
});

test("B1 refuses wrong outlet, date, guests, slot, unsafe host/path and ambiguous parameters",()=>{
  const urls=[
    "https://tabelog.com/en/booking/form_course/new?rcd=13123457&member=2&visit_date=20261102&visit_time=1900",
    "https://tabelog.com/en/booking/form_course/new?rcd=13123456&member=3&visit_date=20261102&visit_time=1900",
    "https://tabelog.com/en/booking/form_course/new?rcd=13123456&member=2&visit_date=20261103&visit_time=1900",
    "https://tabelog.com/en/booking/form_course/new?rcd=13123456&member=2&visit_date=20261102&visit_time=1930",
    "https://tabelog.com.evil.invalid/en/booking/form_course/new?rcd=13123456&member=2&visit_date=20261102&visit_time=1900",
    "https://tabelog.com/yoyaku/tabelog_booking/confirm?rcd=13123456&member=2&visit_date=20261102&visit_time=1900",
  ];
  const original=fixture().source.url;
  urls.push(original+"&member=2",original+"&redirect_uri=https://example.invalid/",original+"#hold",original.replace("https:","http:"),original.replace("https://","https://user@"));
  for(const url of urls){const input=fixture();input.source.url=url;assert.equal(rendered(input),undefined,url);}
  for(const suffix of ["/confirm","/checkout","/account","/hold"]){const input=tableCheck();input.source.url=input.source.url.replace("/reserve?","/reserve"+suffix+"?");assert.equal(rendered(input),undefined);}
  const input=tableCheck();input.source.url=input.source.url.replace("num_people=2","pax=2");assert.equal(rendered(input),undefined);
});

test("B1 revalidates a prepared object against changed request, source evidence and expiry",()=>{
  const original=fixture();const prepared=prepareBookingHandoff(original.source,original.context)!;assert.ok(prepared);
  for(const change of [
    (c:BookingHandoffContext)=>{c.request.partySize=3;},
    (c:BookingHandoffContext)=>{c.request.date="2026-11-03";},
    (c:BookingHandoffContext)=>{c.request.timeWindow={earliest:"20:00",latest:"20:30"};},
    (c:BookingHandoffContext)=>{c.candidate.restaurant.id="other";},
    (c:BookingHandoffContext)=>{c.check.status="UNKNOWN";},
    (c:BookingHandoffContext)=>{c.check.evidenceIds=[];},
    (c:BookingHandoffContext)=>{c.check.sourceProvider="TABLECHECK";},
    (c:BookingHandoffContext)=>{c.evidence[1]!.claims.visibleSlots=["19:30"];},
    (c:BookingHandoffContext)=>{c.evidence[1]!.entityMatch!.confidence="LOW";},
    (c:BookingHandoffContext)=>{c.now="2026-10-29T10:10:00.000Z";},
  ]){const context=fixture().context;change(context);assert.equal(presentBookingHandoff(prepared,context),undefined);}
  const changed=structuredClone(prepared);changed.source.url+="&session=opaque";
  assert.equal(presentBookingHandoff(changed,original.context),undefined);
  original.source.url="https://example.invalid";
  assert.ok(presentBookingHandoff(prepared,original.context),"preparation freezes its source record without retaining mutable caller aliases");
});

test("B1 omissions: unavailable or foreign G1 evidence never produces terms or a plan hint",()=>{
  const input=fixture();input.source.terms!.pages[0]!.text="No supported booking terms here.";
  const result=rendered(input)!; assert.ok(result);assert.deepEqual(result.terms,[]);assert.equal(result.selectionHint,undefined);
  for(const change of [
    (s:BookingHandoffSource)=>{s.terms!.pages[0]!.provider="TABLECHECK";},
    (s:BookingHandoffSource)=>{s.terms!.pages[0]!.candidateId="other";},
    (s:BookingHandoffSource)=>{s.terms!.pages[0]!.sourceEntityId="13123457";},
    (s:BookingHandoffSource)=>{s.terms!.pages[0]!.readAt="2026-10-28T10:00:00.000Z";},
  ]) {const input=fixture();change(input.source);const view=rendered(input)!;assert.deepEqual(view.terms,[]);assert.equal(view.selectionHint,undefined);}
  const conflict=fixture();conflict.source.terms!.cancellationConflict={japanese:structuredClone(conflict.source.terms!.cancellation!),english:structuredClone(conflict.source.terms!.cancellation!)};
  assert.deepEqual(rendered(conflict)!.terms.map(t=>t.label),["Card required"]);
  const absent=fixture();delete absent.source.terms;
  assert.deepEqual(rendered(absent)!.terms,[]);
});


test("B1 language conflict shows both originals and paraphrases without choosing a stricter policy",()=>{
  const input=fixture(),terms=input.source.terms!;
  const english=structuredClone(terms.cancellation!);
  const japanese=structuredClone(english);
  assert.equal(english.status,"ANSWERED");assert.equal(japanese.status,"ANSWERED");
  if(japanese.status!=="ANSWERED"||english.status!=="ANSWERED")throw Error("fixture");
  const url="https://tabelog.com/tokyo/A1301/A130101/13123456/",quote="前日キャンセルは50％、当日は100％です。";
  japanese.answer="Cancellation costs 50% the day before and 100% on the day.";
  japanese.citations=[{...japanese.citations[0]!,url,text:quote}];japanese.checkedPages=[{url,readAt:input.context.now}];
  terms.pages=[...terms.pages,{...terms.pages[0]!,url,text:quote}];
  Object.assign(terms,{cancellationConflict:{japanese,english}});
  const result=rendered(input)!;
  assert.equal(result.cancellationNotice,"Cancellation terms differ between the Japanese and English pages");
  assert.equal(result.terms[0]!.citations[0]!.text,quote);
  assert.equal(result.terms[1]!.citations[0]!.text,"Cancellations on the day cost 100%.");
  assert.match(result.terms[0]!.label,/50%/);assert.equal(result.cancellationConfirmation,"Confirm cancellation terms on the website");
});


test("B1 fixed fee is proven by the captured English help text and never added to TableCheck",()=>{
  const bytes=readFileSync(new URL("./fixtures/booking-handoff/tabelog-help-20261029.html",import.meta.url));
  const result=rendered()!;assert.ok(result.platformFee);
  assert.equal(createHash("sha256").update(bytes).digest("hex"),result.platformFee.documentSHA256);
  assert.equal(result.platformFee.amountPerPersonJPY,440);
  assert.equal(result.platformFee.userCancellationRefund,false);assert.equal(result.platformFee.restaurantCancellationRefund,true);
  assert.equal(result.platformFee.sourceUrl,"https://tabelog.com/en/help");assert.equal(result.platformFee.checkedOn,"2026-10-29");
  for(const quote of result.platformFee.quotes)assert.ok(bytes.toString("utf8").includes(quote));
  assert.equal(rendered(tableCheck())!.platformFee,undefined);
});


test("B1 native Tabelog path ID binds the same numeric merchant without weakening full identity",()=>{
  const input=fixture(),native="en/tokyo/A1301/A130101/13123456";
  input.context.candidate.restaurant.sourceIds.tabelog=native;
  input.source.sourceEntityId=native;
  input.context.evidence.forEach(item=>{item.sourceEntityId=native;});
  assert.equal(rendered(input)?.url,input.source.url);
  for(const change of [
    (x:ReturnType<typeof fixture>)=>{x.source.url=x.source.url.replace("rcd=13123456","rcd=99999999");},
    (x:ReturnType<typeof fixture>)=>{x.context.candidate.restaurant.sourceIds.tabelog="tokyo/A1301/A130101/13123456";},
    (x:ReturnType<typeof fixture>)=>{x.context.evidence[1]!.sourceEntityId="other/13123456";},
    (x:ReturnType<typeof fixture>)=>{x.context.evidence[1]!.entityMatch!.confidence="LOW";},
  ]){const changed=structuredClone(input);change(changed);assert.equal(rendered(changed),undefined);}
});
