import { NextResponse } from 'next/server';
import { analyze } from '@/lib/ai';
import { readJson, rateLimit, apiError } from '@/lib/security';
export const maxDuration=60;
export async function POST(request){try{const body=await readJson(request);await rateLimit(request,'voice',10);await rateLimit(request,'daily_ai',100,'all',86400000);if(!body.audio)return NextResponse.json({error:'Audio required.'},{status:400});const data=await analyze({audio:body.audio,audioMimeType:body.audioMimeType});return NextResponse.json({text:data.text,language:data.language,category:data.category});}catch(e){return apiError(e,'Voice processing is unavailable. You can type your report instead.');}}
