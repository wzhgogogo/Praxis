/** Public image transform grammar observed in the exposed 2026-11-02 HTML.
 * Its `token` is a page-published resize signature, never an account secret.
 * This does not grant browser/document/API admission or allow arbitrary tokens.
 */
export function reviewedPublicRestaurantImage(url: URL): boolean {
  return url.origin==='https://tblg.k-img.com'
    && /^\/resize\/[1-9]\d{0,3}x[1-9]\d{0,3}c\/restaurant\/images\/Rvw\/\d+\/[A-Za-z0-9_-]+\.jpe?g$/i.test(url.pathname)
    && [...url.searchParams.keys()].sort().join(',')==='api,token'
    && url.searchParams.getAll('api').length===1&&url.searchParams.get('api')==='v2'
    && url.searchParams.getAll('token').length===1&&/^[a-f0-9]{7}$/.test(url.searchParams.get('token')??'');
}

/** Groups observed renditions, but never generates or rewrites a fetch URL. */
export function restaurantPhotoRendition(url:URL):{key:string;pixels:number} {
  if(url.origin==='https://tblg.k-img.com'){
    const match=/^(?:\/resize\/(\d+)x(\d+)c)?\/restaurant\/images\/Rvw\/(\d+)\/(?:(\d+)x(\d+)_(?:square|rect)_)?([A-Za-z0-9_-]+\.jpe?g)$/i.exec(url.pathname);
    if(match)return {key:url.origin+'/restaurant/images/Rvw/'+match[3]+'/'+match[6],pixels:Number(match[1]??match[4]??0)*Number(match[2]??match[5]??0)};
  }
  return {key:url.href,pixels:0};
}
