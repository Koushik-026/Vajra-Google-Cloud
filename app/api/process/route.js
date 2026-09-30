import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { processReport, reallocate } from '@/lib/processing';
import { requirePlanner, readJson, apiError, rateLimit } from '@/lib/security';
export const maxDuration=60;
export async function POST(request){
  const denied=requirePlanner(request);if(denied)return denied;
  try{
    await rateLimit(request,'process',30);
    const body=await readJson(request,2000);
    if(body.report_id && /^[A-Za-z0-9]{20}$/.test(body.report_id)) await processReport(body.report_id);
    else if(body.action==='retry_pending') {
      const docs=await adminDb.collection('reports').where('processing_state','==','retry_needed').limit(3).get();
      for(const d of docs.docs)await processReport(d.id);
    }else if(!['reallocate','reprocess_all'].includes(body.action))return NextResponse.json({error:'Invalid action.'},{status:400});
    return NextResponse.json({success:true,budget:await reallocate()});
  }catch(e){return apiError(e);}
}
