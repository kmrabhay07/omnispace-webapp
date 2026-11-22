import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const methods=new Set(['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS']);
const maximumBody=4_400_000;

function reply(response,status,message){
  response.statusCode=status;
  response.setHeader('content-type','application/json; charset=utf-8');
  response.setHeader('cache-control','no-store');
  response.setHeader('x-content-type-options','nosniff');
  response.end(JSON.stringify({message}));
}

export function upstreamUrl(rawUrl,origin,matchedPath){
  const configured=new URL(origin);
  if(configured.protocol!=='https:'||configured.username||configured.password||configured.pathname!=='/'||configured.search||configured.hash)throw Error('Invalid upstream configuration');
  const incoming=new URL(rawUrl,'https://gateway.invalid');
  const path=matchedPath??incoming.searchParams.get('__path');
  if(!path||!path.split('/').every(segment=>/^[A-Za-z0-9_.-]+$/.test(segment)&&segment!=='.'&&segment!=='..'))throw Error('Invalid API path');
  incoming.searchParams.delete('__path');
  const target=new URL('/api/'+path,configured.origin);
  target.search=incoming.searchParams.toString();
  return target;
}

/** Factory keeps integration tests independent of any real credentials/backend. */
export function createGateway({environment=process.env,request=fetch}={}){
  return async function gateway(req,res){
    if(!methods.has(req.method))return reply(res,405,'Method not allowed');
    const secret=environment.OMNISPACE_PROXY_SECRET;
    if(!environment.OMNISPACE_API_ORIGIN||!secret||secret.length<32)return reply(res,503,'The API gateway is not configured.');
    let target;
    try{target=upstreamUrl(req.url,environment.OMNISPACE_API_ORIGIN,typeof req.query?.__path==='string'?req.query.__path:undefined)}catch{return reply(res,400,'Invalid API route or gateway configuration.');}
    const headers=new Headers({'X-Omnispace-Proxy':secret,'Accept':req.headers.accept||'application/json'});
    for(const name of ['authorization','content-type','if-none-match','if-modified-since','range']){
      const value=req.headers[name];if(typeof value==='string')headers.set(name,value);
    }
    let body;
    if(!['GET','HEAD'].includes(req.method)){
      if(req.body!==undefined){body=Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body));}
      else{
        const chunks=[];let size=0;
        for await(const chunk of req){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>maximumBody)return reply(res,413,'Photo data is too large. Use fewer or smaller images.');chunks.push(bytes);}
        body=Buffer.concat(chunks);
      }
      if(body.length>maximumBody)return reply(res,413,'Photo data is too large. Use fewer or smaller images.');
    }
    try{
      const upstream=await request(target,{method:req.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(30_000)});
      // Never forward a redirect revealing the private origin or accepting a new target.
      if(upstream.status>=300&&upstream.status<400&&upstream.status!==304)return reply(res,502,'The API returned an unexpected redirect.');
      res.statusCode=upstream.status;
      for(const name of ['content-type','content-disposition','etag','last-modified','content-range','accept-ranges']){
        const value=upstream.headers.get(name);if(value)res.setHeader(name,value);
      }
      res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');
      if(req.method==='HEAD'||[204,304].includes(upstream.status)||!upstream.body){res.end();return;}
      await pipeline(Readable.fromWeb(upstream.body),res);
    }catch{
      if(!res.headersSent)reply(res,502,'The API is temporarily unavailable. Please try again.');
      else res.destroy();
    }
  };
}

export default createGateway();
