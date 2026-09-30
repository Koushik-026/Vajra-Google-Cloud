import { adminDb } from './firebaseAdmin';
import { embedding } from './ai';
import { allocate, cosine, distanceKm } from './planning.mjs';

const budgetRef=()=>adminDb.collection('budget_pool').doc('current');
export async function saveAdmittedReport(ref, data) {
  return adminDb.runTransaction(async tx => {
    const budget=await tx.get(budgetRef());
    const count=budget.data()?.report_count ?? (await tx.get(adminDb.collection('reports').limit(201))).size;
    if(count>=200) throw Object.assign(new Error('This pilot has reached its 200-report capacity. Please use an official local grievance channel.'),{status:503});
    tx.create(ref,data);
    tx.set(budgetRef(),{report_count:count+1,revision:(budget.data()?.revision || 0)+1},{merge:true});
  });
}
export async function processReport(id) {
  const ref=adminDb.collection('reports').doc(id), initial=await ref.get();
  if(!initial.exists) throw new Error('Report missing');
  if(initial.data().hotspot_id) return {action:'already_processed'};
  const vector=await embedding(initial.data().translated_text || initial.data().text);
  const createdRef=adminDb.collection('hotspots').doc();
  await adminDb.runTransaction(async tx=>{
    // This shared document serializes clustering, including simultaneous creation of a new cluster.
    const lock=await tx.get(budgetRef());
    const reportDoc=await tx.get(ref), report=reportDoc.data();
    if(report.hotspot_id) return;
    const candidates=await tx.get(adminDb.collection('hotspots').where('category','==',report.category).limit(201));
    if(candidates.size>200) throw new Error('Pilot capacity exceeded');
    const match=candidates.docs.map(d=>({id:d.id,...d.data()})).filter(h=>distanceKm(report,h)<=2)
      .map(h=>({...h,similarity:cosine(vector,h.embedding)})).filter(h=>h.similarity>=0.78).sort((a,b)=>b.similarity-a.similarity)[0];
    const now=new Date().toISOString();
    if(match){
      const n=match.corroboration_count || 1;
      tx.update(adminDb.collection('hotspots').doc(match.id),{corroboration_count:n+1,lat:(match.lat*n+report.lat)/(n+1),lng:(match.lng*n+report.lng)/(n+1),updated_at:now});
    }else{
      tx.set(createdRef,{id:createdRef.id,category:report.category,lat:report.lat,lng:report.lng,corroboration_count:1,priority_score:0,funding_status:'queued',sample_budget_used:0,embedding:vector,created_at:now,updated_at:now});
    }
    tx.update(ref,{hotspot_id:match?.id || createdRef.id,processing_state:'complete'});
    tx.set(budgetRef(),{total_budget:lock.data()?.total_budget ?? 100,allocated_so_far:lock.data()?.allocated_so_far ?? 0,revision:(lock.data()?.revision || 0)+1},{merge:true});
  });
  return reallocate();
}
export async function reallocate(totalBudget) {
  return adminDb.runTransaction(async tx=>{
    const budget=await tx.get(budgetRef());
    const hotspots=await tx.get(adminDb.collection('hotspots').limit(201));
    const reports=await tx.get(adminDb.collection('reports').limit(201));
    // Explicit pilot bound keeps every allocation atomic and within Firestore transaction limits.
    if(hotspots.size>200 || reports.size>200) throw new Error('Pilot capacity exceeded; district partitioning required');
    const plan=allocate(hotspots.docs.map(d=>({id:d.id,...d.data()})),totalBudget ?? budget.data()?.total_budget ?? 100);
    const byId=new Map(plan.hotspots.map(h=>[h.id,h]));
    for(const h of plan.hotspots) tx.update(adminDb.collection('hotspots').doc(h.id),{priority_score:h.priority_score,funding_status:h.funding_status,sample_budget_used:h.sample_budget_used});
    for(const d of reports.docs){const h=byId.get(d.data().hotspot_id);if(h)tx.update(d.ref,{status:h.eligible?h.funding_status:'received'});}
    tx.set(budgetRef(),{total_budget:plan.total_budget,allocated_so_far:plan.allocated_so_far,revision:(budget.data()?.revision || 0)+1,updated_at:new Date().toISOString()},{merge:true});
    return {total_budget:plan.total_budget,allocated_so_far:plan.allocated_so_far};
  });
}
export async function finishReport(id) {
  try { await processReport(id); } catch {
    await adminDb.collection('reports').doc(id).update({processing_state:'retry_needed'});
    console.error('Report processing requires planner retry');
  }
}
