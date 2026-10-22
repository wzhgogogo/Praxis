// Evaluation-side source excerpt capture, never a production condition judgment.
import {createHash} from 'node:crypto';
const decode=s=>s.replace(/&(?:amp|quot|apos|lt|gt|nbsp|#\d+|#x[\da-f]+);/gi,x=>{const names={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '},n=Number(x[2]?.toLowerCase()==='x'?'0x'+x.slice(3,-1):x.slice(2,-1));return names[x.toLowerCase()]??(Number.isInteger(n)&&n>=0&&n<=0x10ffff?String.fromCodePoint(n):x);});
const plain=s=>decode(s.replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
export function sourceFragments(html){
 const nodes=[],stack=[];
 for(const m of html.matchAll(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi)){
  const token=m[0];if(/^<!--|^<script|^<style/i.test(token))continue;
  const close=token.match(/^<\/([\w-]+)/)?.[1]?.toLowerCase();if(close){const i=stack.map(n=>n.tag).lastIndexOf(close);if(i>=0){for(const n of stack.slice(i))n.end=m.index+token.length;stack.length=i;}continue;}
  const tag=token.match(/^<([\w-]+)/)?.[1]?.toLowerCase();if(!tag)continue;
  const n={tag,attrs:token,start:m.index,end:m.index+token.length,parent:stack.at(-1)};nodes.push(n);if(!/^(?:br|hr|img|input|meta|link|source|wbr|area|embed)$/.test(tag)&&!token.endsWith('/>'))stack.push(n);
 }
 const attr=(n,key)=>n.attrs.match(new RegExp(`\\b${key}=["']([^"']*)["']`,'i'))?.[1]??'';
 const blocked=n=>{for(let p=n;p;p=p.parent)if(/^(?:aside|nav|footer)$/.test(p.tag)||/review|rvw|recommend|related|nearby|neighbor|advert/i.test(attr(p,'class'))||/aria-hidden=["']true|\bis-hidden\b|\bhidden(?:\s|=|>)|display\s*:\s*none/i.test(p.attrs))return true;return false;};
 const rows=[];
 for(const n of nodes.filter(n=>!blocked(n))){
  let role;
  if(n.tag==='tr'){
   const h=nodes.find(c=>c.parent===n&&c.tag==='th');const heading=h?plain(html.slice(h.start,h.end)):'';
   if(['Categories','Cuisine','Genre'].includes(heading))role='CATEGORY';
   else if(heading==='Average price')role='MERCHANT_AVERAGE_PRICE';
   else if(heading==='Family friendly')role='MERCHANT_FAMILY_POLICY';
  }
  const cls=attr(n,'class').split(/\s+/);
  if(cls.includes('pr-comment-title'))role='MERCHANT_INTRO_TITLE';
  if(cls.includes('pr-comment__body'))role='MERCHANT_INTRO_BODY';
  if(cls.includes('rstdtl-course-list__course-title-text'))role='COURSE_TITLE';
  if(cls.includes('rstdtl-course-list__desc'))role='COURSE_DESCRIPTION';
  if(/^(?:p|h3|h4|dt|dd|span)$/.test(n.tag)&&cls.some(c=>c.startsWith('rstdtl-menu-lst__')))role='MERCHANT_MENU_ITEM';
  if(!role)continue;
  const raw=html.slice(n.start,n.end),text=plain(raw);if(!text||raw.length>12000)continue;
  rows.push({role,text,raw,sha256:createHash('sha256').update(raw).digest('hex'),htmlCharacterOffset:n.start});
 }
 return rows;
}
