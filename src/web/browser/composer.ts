import { $ } from "./runtime.js";
export function updateComposerClearance(){const host=$('workspace-composer'),bottom=parseFloat(getComputedStyle(host).bottom)||0;document.documentElement.style.setProperty('--composer-clearance',(host.hidden?0:host.getBoundingClientRect().height+bottom+24)+'px');}
export function resizeMessage(){const input=$('message');input.style.height='';if($('workspace-composer').contains(input)){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,140)+'px';}}
export function setMessage(value:string){$('message').value=value;resizeMessage();}
export function focusAdjustment(){const input=$('message');if(!input.value)input.placeholder='Try another area, time, or party size…';input.focus({preventScroll:true});}
