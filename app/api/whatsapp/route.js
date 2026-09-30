import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { analyze } from '@/lib/ai';
import { finishReport } from '@/lib/processing';
import { validateReport } from '@/lib/planning.mjs';
import { equal, readRaw, apiError, rateLimit } from '@/lib/security';
export const maxDuration=60;
const graph=()=> 'https://graph.facebook.com/'+(process.env.WHATSAPP_API_VERSION || 'v23.0');
async function reply(to,text){
  if(!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID)return;
  const r=await fetch(graph()+'/'+process.env.WHATSAPP_PHONE_NUMBER_ID+'/messages',{method:'POST',headers:{Authorization:'Bearer '+process.env.WHATSAPP_ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to,type:'text',text:{body:text}}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)console.error('WhatsApp reply failed:',r.status);
}
async function media(id){
  if(!/^\d+$/.test(id || ''))throw new Error('Invalid media ID');
  const headers={Authorization:'Bearer '+process.env.WHATSAPP_ACCESS_TOKEN};
  const meta=await fetch(graph()+'/'+id,{headers,signal:AbortSignal.timeout(10000)});
  if(!meta.ok)throw new Error('Media lookup failed');
  const m=await meta.json(),url=new URL(m.url);
  if(url.protocol!=='https:' || !['facebook.com','fbcdn.net','whatsapp.net'].some(h=>url.hostname===h || url.hostname.endsWith('.'+h)))throw new Error('Invalid media origin');
  if(m.file_size>2000000)throw new Error('Media too large');
  const response=await fetch(url,{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Media download failed');
  return {data:(await readRaw(response,2000000)).toString('base64'),mime:m.mime_type.split(';')[0]};
}
export async function GET(request){
  const q=new URL(request.url).searchParams;
  if(process.env.WHATSAPP_VERIFY_TOKEN && q.get('hub.mode')==='subscribe' && equal(q.get('hub.verify_token'),process.env.WHATSAPP_VERIFY_TOKEN))return new Response(q.get('hub.challenge'),{status:200});
  return new Response('Forbidden',{status:403});
}
export async function POST(request){
  try{
    if(!process.env.WHATSAPP_APP_SECRET)return new Response('Webhook not configured',{status:503});
    const raw=await readRaw(request,256000);
    const expected='sha256='+createHmac('sha256',process.env.WHATSAPP_APP_SECRET).update(raw).digest('hex');
    if(!equal(request.headers.get('x-hub-signature-256'),expected))return new Response('Forbidden',{status:403});
    let body;try{body=JSON.parse(raw.toString());}catch{return new Response('Invalid JSON',{status:400});}
    for(const entry of body.entry || [])for(const change of entry.changes || []){
      const value=change.value;
      if(value?.metadata?.phone_number_id!==process.env.WHATSAPP_PHONE_NUMBER_ID)continue;
      for(const message of value.messages || []){
        if(!message.id || !message.from)continue;
        const hash=x=>createHmac('sha256',process.env.WHATSAPP_APP_SECRET).update(x).digest('hex');
        const eventRef=adminDb.collection('_whatsapp_events').doc(hash(message.id));
        if((await eventRef.get()).exists)continue;
        await rateLimit(request,'whatsapp_sender',8,hash(message.from));
        if(message.type!=='location') await rateLimit(request,'daily_ai',100,'all',86400000);
        const sessionRef=adminDb.collection('_whatsapp_sessions').doc(hash(message.from));
        const analysisInput={};
        if(message.type==='text')analysisInput.text=String(message.text?.body || '').slice(0,3000);
        else if(message.type==='audio' || message.type==='image'){
          const file=await media(message[message.type]?.id);
          if(message.type==='audio'){analysisInput.audio=file.data;analysisInput.audioMimeType=file.mime;}
          else {analysisInput.photo=file.data;analysisInput.photoMimeType=file.mime;analysisInput.text=String(message.image?.caption || 'Infrastructure issue shown in the attached photo.').slice(0,3000);}
        }else if(message.type!=='location'){await reply(message.from,'Please send text, a voice note, or a photo with a caption, followed by your location.');continue;}
        const analysis=message.type==='location'?null:await analyze(analysisInput);
        const reportRef=adminDb.collection('reports').doc();
        const result=await adminDb.runTransaction(async tx=>{
          const event=await tx.get(eventRef),session=await tx.get(sessionRef),budget=await tx.get(adminDb.collection('budget_pool').doc('current'));
          if(event.exists)return null;
          const previous=session.data();
          const staged=previous?.expires_at>Date.now()?previous.report:null;
          if(message.type==='location' && staged){
            let input;try{input=validateReport({...staged,lat:message.location?.latitude,lng:message.location?.longitude});}catch{return {invalid:true};}
            const count=budget.data()?.report_count ?? (await tx.get(adminDb.collection('reports').limit(201))).size;
            if(count>=200) return {full:true};
            tx.set(reportRef,{...input,id:reportRef.id,translated_text:staged.translated_text,language:staged.language,photo_verification:staged.photo_verification,photo_url:null,source:'whatsapp',status:'received',hotspot_id:null,created_at:new Date().toISOString(),processing_state:'pending'});
            tx.set(adminDb.collection('budget_pool').doc('current'),{report_count:count+1,revision:(budget.data()?.revision || 0)+1},{merge:true});
            tx.delete(sessionRef);
            tx.set(eventRef,{created_at:new Date().toISOString(),report_id:reportRef.id});
            return {id:reportRef.id};
          }
          if(analysis)tx.set(sessionRef,{report:analysis,expires_at:Date.now()+3600000});
          tx.set(eventRef,{created_at:new Date().toISOString()});
          return {staged:!!analysis};
        });
        if(result?.id){
          await finishReport(result.id);
          const base=process.env.APP_URL;
          await reply(message.from,'Your report has been received. Tracking ID: '+result.id+(base?'\nTrack it: '+base+'/status?id='+result.id:'')+'\nBudget status is a planning scenario, not a government funding approval.');
        }else if(result)await reply(message.from,result.full?'This pilot is at capacity. Please use your local official grievance channel.':result.staged?'Your report is ready. Share the issue location using WhatsApp’s attachment → Location. Send location last.':'Please send a description, voice note, or captioned photo first, then share a location in India.');
      }
    }
    return NextResponse.json({received:true});
  }catch(e){return apiError(e);}
}
