import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { adminDb } from './firebaseAdmin';

export function equal(a,b) { const x=Buffer.from(a || ''),y=Buffer.from(b || ''); return x.length===y.length && x.length>0 && timingSafeEqual(x,y); }
const sign = value => createHmac('sha256',process.env.PLANNER_PASSCODE || 'disabled').update(value).digest('hex');
export function sessionToken() { const exp=String(Date.now()+8*3600000); return `${exp}.${sign(exp)}`; }
export function isPlanner(request) {
  if (!process.env.PLANNER_PASSCODE) return false;
  const value=request.cookies?.get('vajra_planner')?.value || '';
  const [exp,sig]=value.split('.');
  return /^\d+$/.test(exp || '') && Number(exp)>Date.now() && equal(sig,sign(exp));
}
export function requirePlanner(request) {
  if (!isPlanner(request)) return NextResponse.json({error:'Planner sign-in required.'},{status:401});
  if (!['GET','HEAD'].includes(request.method) && request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({error:'Invalid origin.'},{status:403});
  return null;
}
export async function readRaw(request, max=3200000) {
  const reader=request.body?.getReader(); let size=0; const chunks=[];
  if (!reader) throw Object.assign(new Error('Request body required.'),{status:400});
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw Object.assign(new Error('Upload too large.'),{status:413});}chunks.push(Buffer.from(value));}
  return Buffer.concat(chunks);
}
export async function readJson(request, max=3200000) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw Object.assign(new Error('JSON content required.'),{status:415});
  const raw=await readRaw(request,max);
  try{return JSON.parse(raw.toString('utf8'));}catch{throw Object.assign(new Error('Invalid JSON.'),{status:400});}
}
export async function rateLimit(request, scope, limit=12, actor=null, windowMs=3600000) {
  // Shared Firestore counter; does not reset on serverless cold starts. One document per client/scope.
  const ip=process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for') || 'unknown' : 'local';
  const key=createHmac('sha256',process.env.PLANNER_PASSCODE || process.env.GEMINI_API_KEY || 'vajra').update(`${scope}:${actor || ip}`).digest('hex');
  const ref=adminDb.collection('_rate_limits').doc(key);
  await adminDb.runTransaction(async tx=>{
    const snap=await tx.get(ref), data=snap.data(), now=Date.now();
    const count=data?.reset_at>now ? data.count : 0;
    if(count>=limit) throw Object.assign(new Error('Too many requests. Please try again in an hour.'),{status:429});
    tx.set(ref,{count:count+1,reset_at:data?.reset_at>now?data.reset_at:now+windowMs});
  });
}
export function apiError(error, fallback='Service temporarily unavailable. Please try again.') {
  const status=error.status || 503;
  console.error('API failure:', error.code || error.status || error.name);
  return NextResponse.json({error:status<500?error.message:fallback},{status});
}
