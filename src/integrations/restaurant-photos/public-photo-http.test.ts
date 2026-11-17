import assert from "node:assert/strict";
import { test } from "node:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { IncomingMessage, request as nodeRequest } from "node:http";
import { PublicPhotoHttp, publicPhotoAddress, publicPhotoUrl } from "./public-photo-http.js";

test('Photo URL admission refuses local, special, credentialled and sensitive targets including encoded IPs',()=>{
  for(const ip of ['127.0.0.1','10.1.2.3','100.64.1.2','169.254.169.254','192.168.0.1','198.18.0.2','224.0.0.1','::1','::ffff:127.0.0.1','fc00::1','fe80::1','2001:db8::1','2002:7f00:1::'])assert.equal(publicPhotoAddress(ip),false,ip);
  for(const ip of ['8.8.8.8','1.1.1.1','2606:4700:4700::1111'])assert.equal(publicPhotoAddress(ip),true,ip);
  for(const url of ['http://0x7f000001/a','http://[::ffff:127.0.0.1]/a','https://user:secret@restaurant.example.org/a','file:///tmp/a','https://restaurant.example.org/account/a','https://restaurant.example.org/a?api_key=x','https://restaurant.example.org:444/a'])assert.throws(()=>publicPhotoUrl(url));
  assert.equal(publicPhotoUrl('/image.jpg?width=800','https://restaurant.example.org/menu').href,'https://restaurant.example.org/image.jpg?width=800');
});

test('Only the exact reviewed image transform permits its publicly observed signature; document/API/other tokens remain blocked',()=>{
  const url='https://tblg.k-img.com/resize/660x370c/restaurant/images/Rvw/88965/88965652.jpg?token=1234abc&api=v2';
  assert.equal(publicPhotoUrl(url,undefined,'image').href,url);
  assert.throws(()=>publicPhotoUrl(url));
  for(const bad of [url.replace('tblg.k-img.com','cdn.example.org'),url+'&email=x',url.replace('api=v2','api=v3'),url.replace('1234abc','a-secret-token'),url.replace('/resize/','/account/')])assert.throws(()=>publicPhotoUrl(bad,undefined,'image'));
});

test('Photo HTTP pins the validated DNS address and rejects private DNS and redirect destinations before another dispatch',async()=>{
  const dispatched:Array<{url:string;address:string;headers:unknown}>=[];
  let redirect=false,resolveCount=0;
  const dns=(async()=>{resolveCount++;return [{address:'8.8.8.8',family:4}];});
  const request=((url:URL,options:import('node:http').RequestOptions,callback:(res:IncomingMessage)=>void)=>{
    const req=new EventEmitter() as EventEmitter&{end():void};
    req.end=()=>{
      options.lookup!(url.hostname,{all:true},(error:Error|null,result:unknown)=>{
        assert.equal(error,null);const address=(result as Array<{address:string}>)[0]!.address;
        dispatched.push({url:url.href,address,headers:options.headers});
        const response=new PassThrough() as unknown as IncomingMessage;
        response.statusCode=redirect?302:200;response.headers=redirect?{location:'http://169.254.169.254/latest/meta-data/'}:{'content-type':'image/jpeg'};
        callback(response);if(!redirect)(response as unknown as PassThrough).end(Buffer.from([1,2,3]));
      });
    };return req;
  }) as unknown as typeof nodeRequest;
  const http=new PublicPhotoHttp(dns,request),input={signal:new AbortController().signal,maxBytes:8,allowedOrigins:['https://cdn.example.org'],accept:'image' as const};
  const result=await http.get('https://cdn.example.org/image.jpg',input);
  assert.deepEqual([...result.body],[1,2,3]);assert.equal(resolveCount,1);assert.equal(dispatched[0]!.address,'8.8.8.8');
  assert.deepEqual(Object.keys(dispatched[0]!.headers as object).sort(),['accept','user-agent']);
  redirect=true;await assert.rejects(http.get('https://cdn.example.org/redirect.jpg',input),{code:'NON_PUBLIC_URL'});assert.equal(dispatched.length,2,'private redirect cannot dispatch a third request');
  const privateDns=(async()=>[{address:'10.0.0.1',family:4}]);
  await assert.rejects(new PublicPhotoHttp(privateDns,request).get('https://cdn.example.org/image.jpg',input),{code:'NON_PUBLIC_ADDRESS'});assert.equal(dispatched.length,2);
});
