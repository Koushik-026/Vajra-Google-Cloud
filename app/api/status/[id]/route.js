import { adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { apiError, rateLimit } from '@/lib/security';
export async function GET(request,{params}){
  try{
    const {id}=await params;
    if(!/^[A-Za-z0-9]{20}$/.test(id))return NextResponse.json({error:'Enter a valid 20-character tracking ID.'},{status:400});
    await rateLimit(request,'status',120);
    const doc=await adminDb.collection('reports').doc(id).get();
    if(!doc.exists)return NextResponse.json({error:'Report not found. Check your tracking ID.'},{status:404});
    const r=doc.data();
    const result={id,category:r.category,status:r.status,created_at:r.created_at,processing_state:r.processing_state,photo_verification:r.photo_verification?.checked?{matches_category:r.photo_verification.matches_category}:null};
    if(r.hotspot_id){const h=(await adminDb.collection('hotspots').doc(r.hotspot_id).get()).data();if(h){result.hotspot={corroboration_count:h.corroboration_count};result.status=h.corroboration_count>=2?h.funding_status:'received';}}
    return NextResponse.json(result,{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
  }catch(e){return apiError(e);}
}
