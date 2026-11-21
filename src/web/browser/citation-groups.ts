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
