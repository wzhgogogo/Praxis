import { load } from "cheerio";
import { parseSrcset } from "srcset";
import type { RestaurantCandidate } from "../../domains/restaurant/contracts.js";
import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { candidateStructuredObservation } from "../restaurant-facts/google-listed-website-facts.js";
import { publicPhotoUrl } from "./public-photo-http.js";
import { restaurantPhotoRendition } from "./source-image-policy.js";

export interface SourcePhoto { url: string; attribution?: string; }
export interface ExtractedPhotos { photos: SourcePhoto[]; galleryUrl?: string; }
const irrelevant = /(?:\blogo\b|favicon|sprite|tracking|pixel|banner|advert|\bicon\b)/i;
const otherPlaces = /(?:other restaurants|related restaurants|recommended restaurants|nearby restaurants|他の店舗|周辺の|おすすめの店舗|関連店舗)/i;

/** Source-authored URLs only. Never constructs an original from a thumbnail URL. */
export function extractRestaurantPhotos(page: BrowserSnapshot, candidate: RestaurantCandidate): ExtractedPhotos {
  const $ = load(page.html), found: Array<SourcePhoto & { assetKey:string; pixels:number }> = [];
  const add = (value: unknown, attribution?: string) => {
    if (typeof value !== "string" || !value.trim()) return;
    try {
      const parsed=publicPhotoUrl(value,page.url,'image'),url=parsed.href,rendition=restaurantPhotoRendition(parsed);
      if (irrelevant.test(parsed.pathname)) return;
      const previous=found.find(image=>image.assetKey===rendition.key);
      if(previous){if(rendition.pixels>previous.pixels){previous.url=url;previous.pixels=rendition.pixels;}return;}
      if(found.length<24)found.push({url,assetKey:rendition.key,pixels:rendition.pixels,...(attribution?{attribution}:{})});
    } catch { /* unsafe/non-public/inline resource is not a photo */ }
  };
  const images = (value: unknown, depth=0): void => {
    if (depth>4) return;
    if (Array.isArray(value)) {for (const item of value.slice(0,12)) images(item,depth+1);return;}
    if (typeof value==="string") {add(value);return;}
    if (!value || typeof value!=="object") return;
    const item=value as Record<string,unknown>, credit=item.creditText ?? item.copyrightNotice;
    add(item.contentUrl ?? item.url,typeof credit==="string"?credit:undefined);
  };
  const records=(value:unknown,depth=0):Record<string,unknown>[]=> {
    if (depth>5) return [];
    if (Array.isArray(value)) return value.slice(0,100).flatMap(item=>records(item,depth+1));
    if (!value||typeof value!=="object") return [];
    const item=value as Record<string,unknown>;return [item,...records(item["@graph"],depth+1)];
  };
  for(const script of $('script[type="application/ld+json"]').toArray().slice(0,20)) {
    const text=$(script).text();if(text.length>150_000)continue;
    try {for(const record of records(JSON.parse(text))) {
      // Verify each owning Restaurant record separately; another JSON-LD
      // restaurant on the same page must not donate its images.
      const isolated={...record};
      delete isolated['@graph'];
      const kinds=Array.isArray(record['@type'])?record['@type']:[record['@type']];
      if(!kinds.some(kind=>typeof kind==='string'&&/^(?:Restaurant|CafeOrCoffeeShop|FoodEstablishment)$/i.test(kind)))continue;
      const html='<script type="application/ld+json">'+JSON.stringify(isolated).replaceAll("<","\\u003c")+'</script>';
      if(candidateStructuredObservation(candidate,page.url,"2000-01-01T00:00:00Z",html)) { images(record.image);images(record.photo); }
    }}catch{/* malformed structured metadata does not permit cross-record guessing */}
  }
  const root=$('main').length===1?$('main'):$('body');
  for(const node of root.find('img').toArray().slice(0,150)) {
    const image=$(node), label=[image.attr('alt'),image.attr('title'),image.attr('role')].filter(Boolean).join(' ');
    if(irrelevant.test(label) || image.closest('header,footer,nav,aside,[hidden],[aria-hidden="true"],[role="banner"],[role="complementary"]').length)continue;
    if(image.parents('section,article,[role="region"]').toArray().some(parent=>otherPlaces.test($(parent).attr('aria-label')??'')||otherPlaces.test($(parent).children('h2,h3,h4').text())))continue;
    const width=Number(image.attr('width')),height=Number(image.attr('height'));
    if((width>0&&width<160)||(height>0&&height<100))continue;
    const attributes=[image.attr('src'),image.attr('data-src'),image.attr('data-lazy-src'),image.attr('data-original')].filter((v):v is string=>!!v);
    const sets=[image.attr('srcset'),image.attr('data-srcset'),...image.closest('picture').find('source').toArray().map(n=>$(n).attr('srcset'))].filter((v):v is string=>!!v);
    const variants=sets.flatMap(value=>{try{return parseSrcset(value);}catch{return [];}}).map(item=>({url:item.url,size:item.width??item.density??1})).sort((a,b)=>b.size-a.size);
    const observed=page.images?.filter(item=>item.src===(image.attr('src')??'') && item.srcset===(image.attr('srcset')??'') && item.lazySrc===(image.attr('data-src')??image.attr('data-lazy-src')??image.attr('data-original')??''));
    const current=observed?.length===1?observed[0]?.currentSrc:undefined;
    const preferred=variants[0]?.url ?? attributes.find(value=>!/(?:placeholder|transparent|blank|loading)(?:[._/-]|$)/i.test(value)) ?? current;
    if(!preferred)continue;
    const anchor=image.closest('a[href]').attr('href');let chosen=preferred;
    if(anchor)try{
      const target=new URL(anchor,page.url), base=new URL(page.url), photo=new URL(preferred,page.url);
      if(/\.(?:jpe?g|png|webp)$/i.test(target.pathname)){chosen=publicPhotoUrl(target.href,undefined,'image').href;}
      else if(!anchor.startsWith('#') && target.href!==photo.href && (target.origin!==base.origin||target.pathname.replace(/\/$/,'')!==base.pathname.replace(/\/$/,'')))continue;
    }catch{continue;}
    // currentSrc is used only for a DOM element with an unambiguous observed
    // binding; responsive/lazy declared variants remain source-authored too.
    const caption=image.closest('figure').find('figcaption').text().trim();
    add(chosen!==preferred?chosen:current && !variants.length && !attributes.some(value=>value!==image.attr('src')) ? current : preferred,/(?:©|photo by|credit|撮影|提供)/i.test(caption)?caption:undefined);
  }
  const og=$('meta[property="og:image"],meta[property="og:image:url"]').first().attr('content');
  if(og)try {
    const url=publicPhotoUrl(og,page.url,'image'),asset=restaurantPhotoRendition(url),index=found.findIndex(item=>item.assetKey===asset.key);
    if(index>0)found.unshift(...found.splice(index,1));
    // An OG-only poster/logo is never sufficient photo ownership evidence.
  }catch{/* malformed metadata */}
  let galleryUrl:string|undefined,galleryPriority=0;
  for(const a of root.find('a[href]').toArray()) {
    const label=$(a).text().replace(/\s+/g,' ').trim();if(!/^(?:photos?|gallery|photo gallery|写真(?:一覧)?|フォト)(?:\s*\(?[\d,]+\)?)?$/i.test(label))continue;
    try {const url=publicPhotoUrl($(a).attr('href')!,page.url),base=new URL(page.url);
      const priority=/\d/.test(label)?2:1;
      if(priority>galleryPriority&&url.origin===base.origin&&url.pathname!==base.pathname&&url.pathname.startsWith(base.pathname.replace(/\/$/,'')+'/')){galleryUrl=url.href;galleryPriority=priority;}
    }catch{/* not a public same-outlet album */}
  }
  return {photos:found.slice(0,8).map(({url,attribution})=>({url,...(attribution?{attribution}:{})})),...(galleryUrl?{galleryUrl}:{})};
}
