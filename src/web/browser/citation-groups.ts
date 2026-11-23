export interface SourceExcerpt {url:string;readAt?:string;text?:string;label?:string}
export interface CitationGroup {url:string;readAt?:string;excerpts:Array<{text:string;label?:string}>}
/** Identity is the exact source URL and reading time; never replace old times with a maximum. */
export function groupCitations(items:readonly SourceExcerpt[]):CitationGroup[]{
 const groups=new Map<string,CitationGroup>();
 for(const item of items){
  const key=JSON.stringify([item.url,item.readAt??null]);let group=groups.get(key);
  if(!group){group={url:item.url,...(item.readAt?{readAt:item.readAt}:{}),excerpts:[]};groups.set(key,group);}
  if(item.text&&!group.excerpts.some(e=>e.text===item.text&&e.label===item.label))group.excerpts.push({text:item.text,...(item.label?{label:item.label}:{})});
 }
 return [...groups.values()];
}

/** Q&A-only cleanup: never change answer prose, other source fields or reading-time groups. */
export function questionCitations(items:readonly SourceExcerpt[]):SourceExcerpt[]{
 const normalize=(text:string)=>text.normalize('NFKC').toLowerCase().replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').trim();
 const header=(text:string)=>['non-smoking/smoking','禁煙・喫煙'].includes(normalize(text).replace(/\s*\/\s*/g,'/'));
 const status=(text:string)=>/^(?:non[- ]?smoking|all seats? non[- ]?smoking|smoking (?:allowed|permitted)|(?:全席)?禁煙|喫煙可|分煙)$/.test(normalize(text));
 const key=(item:SourceExcerpt)=>JSON.stringify([item.url,item.readAt??null]);
 const withStatus=new Set(items.filter(item=>item.text&&status(item.text)).map(key));
 return items.filter(item=>!item.text||!header(item.text)||!withStatus.has(key(item)));
}
