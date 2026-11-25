import {groupCitations,type SourceExcerpt} from './citation-groups.js';
import {element} from './runtime.js';
import {link,readAt,citationSourceName} from './format.js';
export function renderCitations(container:HTMLElement,items:readonly SourceExcerpt[],collapsed=true){
 if(!items.length)return;
 const groups=groupCitations(items),host=collapsed?element('details',undefined,'citation-sources'):element('div',undefined,'citation-sources');
 host.dataset.sourceId=JSON.stringify(groups.map(g=>[g.url,g.readAt??null]));
 if(host instanceof HTMLDetailsElement)host.append(element('summary','Source'));
 for(const group of groups){
  const block=element('div',undefined,'citation-group');block.dataset.sourceId=JSON.stringify([group.url,group.readAt??null]);
  for(const excerpt of group.excerpts){if(excerpt.label)block.append(element('p',excerpt.label,'citation-context'));block.append(element('blockquote',excerpt.text));}
  block.append(citationFooter(group));host.append(block);
 }
 container.append(host);
}

export function citationFooter(group:Pick<SourceExcerpt,'url'|'readAt'>){
 const footer=element('p',undefined,'citation-footer'),source=link(citationSourceName(group.url),group.url),arrow=element('span',' ↗');arrow.setAttribute('aria-hidden','true');source.append(arrow);footer.append(source);
 if(group.readAt)footer.append(document.createTextNode(' · '+readAt(group.readAt)));
 return footer;
}
