import type { RestaurantSearchIntent } from './contracts.js';

export interface PositiveDiscoveryCriterion {
  criterionRef: string;
  text: string;
  strength: 'HARD' | 'SOFT' | 'UNSPECIFIED';
}
export interface DiscoveryRetrievalSelection {
  keyword?: string;
  categoryUrl?: string;
  criterionRef?: string;
  reason: string;
  accepted: boolean;
  rejectionReason?: string;
  keep?: boolean;
}

export function positiveDiscoveryCriteria(intent: RestaurantSearchIntent): PositiveDiscoveryCriterion[] {
  return intent.criteria.flatMap((criterion, index) => criterion.polarity === 'POSITIVE'
    ? [{ criterionRef: `criterion:${index}`, text: criterion.text, strength: criterion.strength }] : []);
}

export function validateDiscoveryRetrieval(
  value: unknown,
  intent: RestaurantSearchIntent,
  locationName: string,
  observedCategoryUrls: readonly string[],
): DiscoveryRetrievalSelection {
  const rejected = (rejectionReason: string): DiscoveryRetrievalSelection => ({
    accepted: false, reason: 'Use a general list after rejected retrieval proposal.', rejectionReason,
  });
  if (!value || typeof value !== 'object' || Array.isArray(value)) return rejected('INVALID_PROPOSAL');
  const proposal = value as Record<string, unknown>;
  if (Object.keys(proposal).some(key => !['choice', 'keyword', 'criterionRef', 'categoryUrl', 'reason'].includes(key))
      || !['KEYWORD', 'CATEGORY', 'COMBINED', 'GENERAL', 'KEEP'].includes(String(proposal.choice))
      || !['keyword', 'criterionRef', 'categoryUrl', 'reason'].every(key => typeof proposal[key] === 'string')) {
    return rejected('INVALID_PROPOSAL');
  }
  const keyword = String(proposal.keyword).trim();
  const categoryUrl = String(proposal.categoryUrl);
  const criterionRef = String(proposal.criterionRef);
  const withKeyword = proposal.choice === 'KEYWORD' || proposal.choice === 'COMBINED';
  const withCategory = proposal.choice === 'CATEGORY' || proposal.choice === 'COMBINED';
  if ((!withKeyword && keyword) || (!withCategory && categoryUrl)) return rejected('UNUSED_RETRIEVAL_FIELDS');
  if (withKeyword) {
    const criterion = positiveDiscoveryCriteria(intent).find(item => item.criterionRef === criterionRef);
    if (!criterion || /[\p{N}¥￥$€£]|\b(?:price|budget|yen|dollars?|guests?|people|persons?|minutes?|hours?)\b/iu.test(criterion.text)) {
      return rejected('NON_RETRIEVABLE_CRITERION');
    }
    const phrase = (text: string) => text.normalize('NFKC').toLowerCase().replace(/[\s/-]+/g, ' ').trim();
    if (/\b(?:no|not|without|exclude|except)\b/iu.test(keyword)
        || intent.criteria.some(item => item.polarity === 'NEGATIVE' && phrase(item.text) && phrase(keyword).includes(phrase(item.text)))) {
      return rejected('NEGATIVE_KEYWORD');
    }
    const words = keyword.split(/\s+/u);
    const placeWords = [
      ...locationName.matchAll(/[\p{L}\p{N}]+/gu), ...intent.area.query.matchAll(/[\p{L}\p{N}]+/gu),
    ].map(match => match[0].toLowerCase());
    if (!keyword || words.length > 3 || /[\p{N}¥￥$€£]/u.test(keyword)
        || (keyword.match(/[\p{L}\p{N}]+/gu) ?? []).some(word => placeWords.includes(word.toLowerCase()))
        || /\b(?:today|tonight|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|guests?|people|persons?|yen|price|budget|dollars?|cheap|expensive|noon|midnight|am|pm)\b|今天|明天|今晚|人数|予算|预算/iu.test(keyword)) {
      return rejected('INVALID_KEYWORD');
    }
  }
  if (withCategory && !observedCategoryUrls.includes(categoryUrl)) return rejected('UNOBSERVED_OR_OUTSIDE_REGION_CATEGORY');
  return {
    accepted: true, reason: String(proposal.reason),
    ...(withKeyword ? { keyword, criterionRef } : {}), ...(withCategory ? { categoryUrl } : {}),
    ...(proposal.choice === 'KEEP' ? { keep: true } : {}),
  };
}
