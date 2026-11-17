import assert from "node:assert/strict";
import { test } from "node:test";
import { extractRestaurantPhotos } from "./extract-photos.js";

const candidate={restaurant:{id:'shop',outletName:'Test Sushi',address:'1-2 Shibuya Tokyo',sourceIds:{},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'HIGH' as const};
const page=(html:string)=>({url:'https://restaurant.example.org/shop/',html,text:'Test Sushi 1-2 Shibuya Tokyo',title:'Test Sushi'});

test('Photos retain only the owning Restaurant metadata, main photos, declared responsive/lazy URLs and source credit',()=>{
  const record={'@context':'https://schema.org','@graph':[
    {'@type':'WebSite',image:'/site-poster.jpg'},
    {'@type':'Restaurant',name:'Other Sushi',address:'99 Osaka',image:'/other-store.jpg'},
    {'@type':'Restaurant',name:'Parent Place',address:'99 Osaka',image:'/wrong-parent.jpg','@graph':[{'@type':'Restaurant',name:'Test Sushi',address:'1-2 Shibuya Tokyo',image:{contentUrl:'/own.jpg',creditText:'Photo by Test Restaurant'}}]},
    {'@type':'Restaurant',name:'Test Sushi',address:'1-2 Shibuya Tokyo',image:{contentUrl:'/own.jpg',creditText:'Photo by Test Restaurant'}},
  ]};
  const html='<script type="application/ld+json">'+JSON.stringify(record)+'</script><meta property="og:image" content="/site-poster.jpg"><main><h1>Test Sushi</h1><figure><img src="/small.jpg" srcset="/small.jpg 320w, https://cdn.example.org/fill,w_1000/photo.jpg 1000w" width="1000" height="650"></figure><img src="/placeholder.png" data-src="/lazy.jpg"><aside><img src="/other.jpg"></aside><section><h2>Other restaurants</h2><img src="/foreign.jpg"></section><a href="/another-store/"><img src="/linked-other.jpg"></a><img src="/logo.png" width="80" height="50"><a href="/shop/photos/">Photos</a></main>';
  const result=extractRestaurantPhotos(page(html),candidate);
  assert.deepEqual(result.photos,[
    {url:'https://restaurant.example.org/own.jpg',attribution:'Photo by Test Restaurant'},
    {url:'https://cdn.example.org/fill,w_1000/photo.jpg'},
    {url:'https://restaurant.example.org/lazy.jpg'},
  ]);
  assert.equal(result.galleryUrl,'https://restaurant.example.org/shop/photos/');
});

test('An OG-only image, unsafe URLs, opaque backgrounds and foreign album links do not produce a restaurant photo',()=>{
  const result=extractRestaurantPhotos(page('<meta property="og:image" content="/poster.jpg"><main><img src="http://127.0.0.1/internal.jpg"><img src="data:image/png;base64,AAAA"><img src="https://cdn.example.org/image.jpg?token=secret"><a href="https://another.example.org/photos/">Photos</a><div style="background-image:url(/unowned.jpg)"></div></main>'),candidate);
  assert.deepEqual(result,{photos:[]});
});

test('Observed public CDN renditions keep the larger exact URL and prefer a counted main gallery over menu photos',()=>{
  // Exposed public URL shapes from the 2026-11-02 source observation; synthetic
  // name/address isolate rendition selection from restaurant identity matching.
  const large='https://tblg.k-img.com/resize/660x370c/restaurant/images/Rvw/88965/88965652.jpg?token=42b72af&api=v2';
  const small='https://tblg.k-img.com/restaurant/images/Rvw/88965/320x320_square_88965652.jpg';
  const html='<script type="application/ld+json">'+JSON.stringify({'@type':'Restaurant',name:'Test Sushi',address:'1-2 Shibuya Tokyo',image:[small]})+'</script><meta property="og:image" content="'+small+'"><main><img src="'+large+'" alt="Test Sushi"><a href="/shop/menu/photo/">Photos</a><a href="/shop/photos/">Photos (1,301)</a></main>';
  assert.deepEqual(extractRestaurantPhotos(page(html),candidate),{photos:[{url:large}],galleryUrl:'https://restaurant.example.org/shop/photos/'});
});
