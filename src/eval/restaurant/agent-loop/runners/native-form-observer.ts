import {createHash} from 'node:crypto';
import type {CDPSession,Page} from 'playwright-core';

export interface NativeFormObservation {
  observationPoint:'INDEPENDENT_NATIVE_FORM';
  documentOrigin:string;actionOrigin:string;actionPathname:string;method:string;matches:number;
  fields:Array<{key:string;valueSha256:string}>;
  typed:Array<{key:string;valueSha256:string;sensitiveFormat:boolean}>;
}
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const world='praxis-eval-native-form-observation';
const binding='praxisEvalNativeForm';
/** Passive isolated-world formdata/input observation. Page scripts cannot call
 * its binding. Nothing imports a Guard verdict or authorizes a request; only
 * hashes leave the observer. Capture runs synchronously at native FormData
 * construction, so a paused navigation cannot deadlock a page.evaluate. */
export class NativeFormObserver {
  private installed=new Set<number>();
  private rows:NativeFormObservation[]=[];
  private initialized=false;
  constructor(private readonly cdp:CDPSession,private readonly frameId:string){}
  async observe(_page:Page):Promise<void>{
    if(!this.initialized){
      await this.cdp.send('Runtime.enable');
      await this.cdp.send('Runtime.addBinding',{name:binding,executionContextName:world});
      this.cdp.on('Runtime.bindingCalled',event=>{
        if(event.name!==binding||!this.installed.has(event.executionContextId)||event.payload.length>200_000)return;
        try{
          const raw=JSON.parse(event.payload);
          if(!Array.isArray(raw.fields)||!Array.isArray(raw.typed)||raw.fields.length>200||raw.typed.length>200)return;
          const fields=raw.fields.map(([key,value]:[string,string])=>{if(typeof key!=='string'||typeof value!=='string')throw Error('Invalid native field');return{key,valueSha256:hash(value)};});
          const typed=raw.typed.map(({key,value}:{key:string;value:string})=>{if(typeof key!=='string'||typeof value!=='string')throw Error('Invalid typed field');return{key,valueSha256:hash(value),sensitiveFormat:/[@\r\n]|Bearer\s|\bsk-|\b(?:cookie|token|password|authorization)\s*[:=]/iu.test(value)||!/^\d{4}-\d{2}-\d{2}$/.test(value)&&/\+?\d[\d()\s-]{8,}\d/u.test(value)};});
          if([raw.documentOrigin,raw.actionOrigin,raw.actionPathname,raw.method].some(value=>typeof value!=='string'))return;
          this.rows.push({observationPoint:'INDEPENDENT_NATIVE_FORM',documentOrigin:raw.documentOrigin,actionOrigin:raw.actionOrigin,actionPathname:raw.actionPathname,method:raw.method,matches:1,fields,typed});
          if(this.rows.length>200)this.rows.shift();
        }catch{/* Incomplete external evidence remains an audit gap. */}
      });this.initialized=true;
    }
    const {executionContextId}=await this.cdp.send('Page.createIsolatedWorld',{frameId:this.frameId,worldName:world});
    if(this.installed.has(executionContextId))return;
    this.installed.add(executionContextId);
    this.rows=[];
    await this.cdp.send('Runtime.evaluate',{contextId:executionContextId,expression:`(()=>{
      const events=[];
      document.addEventListener('input',event=>{const node=event.target;if(event.isTrusted&&(node instanceof HTMLTextAreaElement||node instanceof HTMLInputElement&&!['checkbox','radio','range','button','submit','reset'].includes(node.type)))events.push({node,value:node.value});},true);
      document.addEventListener('formdata',event=>{
        const form=event.target;if(!(form instanceof HTMLFormElement))return;
        const active=document.activeElement,button=(active instanceof HTMLButtonElement||active instanceof HTMLInputElement)&&active.form===form?active:undefined;
        const method=button?.hasAttribute('formmethod')?button.formMethod:form.method;
        const action=new URL(button?.hasAttribute('formaction')?button.formAction:form.action);
        const fields=[...event.formData.entries()];if(fields.length>200||fields.some(([,value])=>typeof value!=='string'))return;
        ${binding}(JSON.stringify({documentOrigin:location.origin,actionOrigin:action.origin,actionPathname:action.pathname,method:method.toUpperCase(),fields,typed:events.filter(event=>event.node.form===form).map(event=>({key:event.node.name,value:event.value}))}));
      },true);
    })()`});
  }
  async capture(_page:Page,destination:string):Promise<NativeFormObservation|undefined>{
    const url=new URL(destination);
    const canonical=(fields:Array<{key:string;valueSha256:string}>)=>JSON.stringify(fields.map(row=>[row.key,row.valueSha256]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
    const requested=canonical([...url.searchParams].map(([key,value])=>({key,valueSha256:hash(value)})));
    const matches=this.rows.filter(row=>row.actionOrigin===url.origin&&row.actionPathname===url.pathname&&row.method==='GET'&&canonical(row.fields)===requested);
    const unique=[...new Map(matches.map(row=>[JSON.stringify(row),row])).values()];
    return unique.length===1?unique[0]:unique.length?{...unique[0]!,matches:unique.length}:undefined;
  }
}
