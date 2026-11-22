import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createGateway,upstreamUrl} from '../api/gateway.mjs';

const secret='synthetic-test-secret-never-used-in-production';
async function fixture(t,handler){
  const server=createServer(handler);server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  return 'http://127.0.0.1:'+server.address().port;
}
const configured={OMNISPACE_API_ORIGIN:'https://backend.example',OMNISPACE_PROXY_SECRET:secret};

test('routes stay under /api and retain filters without trusting arbitrary upstreams',()=>{
  assert.equal(upstreamUrl('/api/gateway?__path=properties&page=2&sort=newest','https://backend.example').href,'https://backend.example/api/properties?page=2&sort=newest');
  assert.equal(upstreamUrl('/api/properties?page=2','https://backend.example','properties').href,'https://backend.example/api/properties?page=2');
  for(const path of ['../admin','/admin','https://evil.example','properties/../auth','a%2fb']){
    assert.throws(()=>upstreamUrl('/api/gateway?__path='+encodeURIComponent(path),'https://backend.example'));
  }
  for(const origin of ['http://backend.example','https://secret@backend.example','https://backend.example/private'])assert.throws(()=>upstreamUrl('/?__path=properties',origin));
});

test('forwards JWT/body but replaces spoofed proxy headers and hides upstream identity',async t=>{
  let captured;
  const gateway=createGateway({environment:configured,request:async(url,options)=>{
    captured={url:String(url),...options};
    return new Response(JSON.stringify({saved:true}),{status:201,headers:{'content-type':'application/json','server':'private-server','access-control-allow-origin':'*'}});
  }});
  const base=await fixture(t,gateway);
  const response=await fetch(base+'/api/gateway?__path=designs',{method:'POST',headers:{'authorization':'Bearer fake-user-jwt','content-type':'application/json','X-Omnispace-Proxy':'spoofed'},body:JSON.stringify({name:'A room'})});
  assert.equal(response.status,201);assert.deepEqual(await response.json(),{saved:true});
  assert.equal(captured.headers.get('X-Omnispace-Proxy'),secret);assert.equal(captured.headers.get('authorization'),'Bearer fake-user-jwt');
  assert.equal(JSON.parse(captured.body).name,'A room');assert.equal(captured.redirect,'manual');
  assert.equal(response.headers.get('cache-control'),'no-store');assert.notEqual(response.headers.get('server'),'private-server');
  assert.equal(response.headers.get('X-Omnispace-Proxy'),null);
});

test('401 responses remain unauthorized rather than becoming successful proxy responses',async t=>{
  const base=await fixture(t,createGateway({environment:configured,request:async()=>new Response('{"message":"Sign in to continue"}',{status:401})}));
  const response=await fetch(base+'/?__path=designs');assert.equal(response.status,401);
});

test('redirects and network failures do not reveal the upstream or secrets',async t=>{
  for(const request of [async()=>new Response(null,{status:302,headers:{location:'https://backend.example/private'}}),async()=>{throw Error('secret='+secret)}]){
    const base=await fixture(t,createGateway({environment:configured,request}));
    const response=await fetch(base+'/?__path=properties');const text=await response.text();
    assert.equal(response.status,502);assert.equal(response.headers.get('location'),null);
    assert.ok(!text.includes(secret)&&!text.includes('backend.example'));
  }
});

test('missing configuration fails closed and oversized requests are not forwarded',async t=>{
  let calls=0;
  const request=async()=>{calls++;return new Response('{}')};
  const missing=await fixture(t,createGateway({environment:{},request}));
  assert.equal((await fetch(missing+'/?__path=properties')).status,503);
  const configuredBase=await fixture(t,createGateway({environment:configured,request}));
  assert.equal((await fetch(configuredBase+'/?__path=designs',{method:'POST',body:'x'.repeat(4_400_001)})).status,413);
  assert.equal(calls,0);
});
