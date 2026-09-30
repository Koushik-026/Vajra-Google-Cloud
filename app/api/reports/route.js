import { adminDb } from '@/lib/firebaseAdmin';
import { NextResponse, after } from 'next/server';
import { analyze } from '@/lib/ai';
import { validateReport } from '@/lib/planning.mjs';
import { finishReport, saveAdmittedReport } from '@/lib/processing';
import { apiError, rateLimit, readJson, requirePlanner } from '@/lib/security';
export const maxDuration=60;
export async function POST(request) {
  try {
    const body=await readJson(request);
    let input;try{input=validateReport(body);}catch(e){e.status=400;throw e;}
    await rateLimit(request,'intake',10);
    await rateLimit(request,'daily_ai',100,'all',86400000);
    const analysis=await analyze({...input,photo:body.photo,photoMimeType:body.photoMimeType});
    const ref=adminDb.collection('reports').doc();
    await saveAdmittedReport(ref,{...input,id:ref.id,translated_text:analysis.translated_text,language:analysis.language,photo_verification:analysis.photo_verification,
      photo_url:null,source:'web',status:'received',hotspot_id:null,created_at:new Date().toISOString(),processing_state:'pending'});
    after(()=>finishReport(ref.id));
    return NextResponse.json({id:ref.id,status:'received'},{status:201});
  }catch(e){return apiError(e,'We could not save your report. Your form is preserved; please try again.');}
}
export async function GET(request) {
  const denied=requirePlanner(request);if(denied)return denied;
  try {
    const snap=await adminDb.collection('reports').orderBy('created_at','desc').limit(201).get();
    const reports=snap.docs.map(d=>({id:d.id,category:d.data().category,status:d.data().status,processing_state:d.data().processing_state,created_at:d.data().created_at}));
    return NextResponse.json({reports},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return apiError(e);}
}
