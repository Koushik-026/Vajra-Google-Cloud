import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requirePlanner, apiError } from '@/lib/security';
export async function GET(request){
  const denied=requirePlanner(request);if(denied)return denied;
  try{
    const snap=await adminDb.collection('hotspots').orderBy('priority_score','desc').limit(201).get();
    const hotspots=snap.docs.map(d=>{const h=d.data();return {id:d.id,category:h.category,lat:h.lat,lng:h.lng,corroboration_count:h.corroboration_count,priority_score:h.priority_score,funding_status:h.funding_status,sample_budget_used:h.sample_budget_used,created_at:h.created_at};});
    return NextResponse.json({hotspots},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return apiError(e);}
}
