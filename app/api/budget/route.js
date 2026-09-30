import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { reallocate } from '@/lib/processing';
import { requirePlanner, readJson, apiError, rateLimit } from '@/lib/security';
export async function GET(request){
  const denied=requirePlanner(request);if(denied)return denied;
  try{const d=await adminDb.collection('budget_pool').doc('current').get();return NextResponse.json({...d.data(),total_budget:d.data()?.total_budget ?? 100,allocated_so_far:d.data()?.allocated_so_far ?? 0,as_of:Date.now()},{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}
}
export async function PUT(request){
  const denied=requirePlanner(request);if(denied)return denied;
  try{
    const body=await readJson(request,1000);
    if(!Number.isFinite(body.total_budget) || body.total_budget<0 || body.total_budget>10000)return NextResponse.json({error:'Budget must be a number from 0 to 10,000 lakhs.'},{status:400});
    await rateLimit(request,'budget',60);
    return NextResponse.json({success:true,...await reallocate(body.total_budget)});
  }catch(e){return apiError(e);}
}
