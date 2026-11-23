import { candidate } from './queries.js';
import { $, state } from "./runtime.js";
let adjusting=false;
export function syncComposerPlaceholder(){const input=$('message'),place=state.view&&state.ui.view==='DETAILS'?candidate():undefined;if(place)input.placeholder='Ask about '+place.restaurant.outletName;else if(!(adjusting&&document.activeElement===input))input.removeAttribute('placeholder');}
export function blurComposer(){adjusting=false;syncComposerPlaceholder();syncComposerViewport();}
export function syncComposerViewport(){const active=matchMedia('(max-width:959px)').matches&&document.activeElement===$('message')&&!$('case-workspace').hidden;document.body.classList.toggle('composer-focused',active);if(active){const viewport=window.visualViewport;document.documentElement.style.setProperty('--workspace-viewport-top',(viewport?.offsetTop??0)+'px');document.documentElement.style.setProperty('--workspace-viewport-height',(viewport?.height??innerHeight)+'px');if(window.scrollY)window.scrollTo({top:0,behavior:'instant'});}}
export function updateComposerClearance(){const host=$('workspace-composer');document.documentElement.style.setProperty('--composer-height',host.getBoundingClientRect().height+'px');const bottom=parseFloat(getComputedStyle(host).bottom)||0;document.documentElement.style.setProperty('--composer-clearance',(host.hidden?0:host.getBoundingClientRect().height+bottom+24)+'px');}
export function resizeMessage(){const input=$('message');input.style.height='';if($('workspace-composer').contains(input)){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,140)+'px';}}
export function setMessage(value:string){$('message').value=value;resizeMessage();}
export function focusAdjustment(){const input=$('message');adjusting=!input.value;if(adjusting)input.placeholder='Try another area, time, or party size…';input.focus({preventScroll:true});}
