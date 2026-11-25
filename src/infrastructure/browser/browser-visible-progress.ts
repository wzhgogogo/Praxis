import {normalizedTextKey} from "../../core/text-key.js";

/** No opaque ids, observation refs or incidental page prose in visible state. */
export interface VisibleProgressControl {
  kind: string; role?: string; label: string; value?: string; href?: string; type?: string;
  visible?: boolean; disabled?: boolean; selected?: boolean; expanded?: boolean; checked?: boolean;
  min?: number | string; max?: number | string; valueText?: string; scrollTop?: number;
  blockedByActiveLayer?: boolean;
}
export function visibleProgressKey(url: string, controls: readonly VisibleProgressControl[]): string {
  return JSON.stringify([url, controls.filter(c => c.visible !== false).map(c => JSON.stringify({
    kind:c.kind,role:c.role,label:normalizedTextKey(c.label),value:c.value,href:c.href,type:c.type,
    disabled:c.disabled===true,selected:c.selected===true,expanded:c.expanded===true,checked:c.checked===true,
    min:c.min,max:c.max,valueText:c.valueText,scrollTop:c.scrollTop,blocked:c.blockedByActiveLayer===true,
  })).sort()]);
}
export function visibleActionKey(type: string, target: VisibleProgressControl | undefined, value: unknown): string {
  return JSON.stringify([type,target ? [target.kind,target.role,normalizedTextKey(target.label),target.href,target.type] : "PAGE",value]);
}
/** One source skill owns this scope. Real progress does not erase prior stalls. */
export class BrowserVisibleProgress {
  private readonly actions = new Set<string>();
  private stalls = 0;
  repeated(state: string, action: string): boolean { return this.actions.has(JSON.stringify([state,action])); }
  executed(state: string, action: string): void { this.actions.add(JSON.stringify([state,action])); }
  noProgress(): boolean { return ++this.stalls >= 2; }
  get count(): number {return this.stalls;}
}

/** A single observed input cannot retain two authoritative values at once. */
export function filledAuthoritativeField(value: string | undefined, values: Readonly<Record<string,string | number | undefined>>): string | undefined {
  if (!value) return undefined;
  return Object.keys(values).find(field => values[field] !== undefined && normalizedTextKey(value) === normalizedTextKey(String(values[field])));
}
