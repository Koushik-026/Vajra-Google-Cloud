import { NextResponse } from 'next/server';
import { apiError, equal, isPlanner, rateLimit, readJson, sessionToken } from '@/lib/security';
export async function GET(request){return NextResponse.json({authenticated:isPlanner(request)},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request){
  try{
    if(!process.env.PLANNER_PASSCODE)return NextResponse.json({error:'Planner access has not been configured.'},{status:503});
    if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Invalid origin.'},{status:403});
    await rateLimit(request,'login',10);
    const body=await readJson(request,1000);
    if(typeof body.passcode!=='string' || !equal(body.passcode,process.env.PLANNER_PASSCODE))return NextResponse.json({error:'Incorrect passcode.'},{status:401});
    const response=NextResponse.json({authenticated:true});
    response.cookies.set('vajra_planner',sessionToken(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:28800});
    return response;
  }catch(e){return apiError(e);}
}
export async function DELETE(){const r=NextResponse.json({authenticated:false});r.cookies.set('vajra_planner','',{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:0});return r;}
