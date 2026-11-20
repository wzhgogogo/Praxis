export interface Slot { dateTime: string; partySize: number }
export interface Offer extends Slot { id: string }
export interface SelectionScope { userId: string; caseId: string; revision: number; candidateId: string }

export function selectionKey(scope: SelectionScope): string {
  return "praxis:slot:" + JSON.stringify([scope.userId, scope.caseId, scope.revision, scope.candidateId]);
}
export function readSelection(storage: Pick<Storage, "getItem">, scope: SelectionScope): Slot | undefined {
  const raw = storage.getItem(selectionKey(scope));
  if (!raw) return undefined;
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null || !("dateTime" in value) || !("partySize" in value)
    || typeof value.dateTime !== "string" || !Number.isInteger(value.partySize)) return undefined;
  return { dateTime: value.dateTime, partySize: value.partySize as number };
}
export function projectSelection(selected: Slot | undefined, offers: readonly Offer[]) {
  const offer = selected ? offers.find(item => item.dateTime === selected.dateTime && item.partySize === selected.partySize) : offers[0];
  return { offerId: offer?.id, reselect: !!selected && offers.length > 0 && !offer };
}
