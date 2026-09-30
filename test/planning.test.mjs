import test from 'node:test';
import assert from 'node:assert/strict';
import { allocate, validateReport, openDemand } from '../lib/planning.mjs';
const make=(id,category,count)=>({id,category,corroboration_count:count,lat:17,lng:78,created_at:'2026-09-30T00:00:00Z'});
const now=Date.parse('2026-09-30T12:00:00Z');
test('a single report cannot receive a funded planning status',()=>{
  const plan=allocate([make('only','water_supply',1)],100,now);
  assert.equal(plan.allocated_so_far,0);
  assert.equal(plan.hotspots[0].funding_status,'queued');
  assert.match(plan.hotspots[0].decision_reason,/second/);
});
test('ranked allocation never exceeds budget and skips unfundable needs',()=>{
  const plan=allocate([make('a','water_supply',4),make('b','health_facility',2),make('c','streetlights',2)],20,now);
  assert.equal(plan.allocated_so_far,20);
  assert.deepEqual(plan.hotspots.filter(h=>h.funding_status==='funded').map(h=>h.id),['a','c']);
  assert.equal(plan.remaining,0);
});
test('scenario export preserves coordinates and makes simulation explicit',()=>{
  const h=allocate([make('a','roads',2)],20,now).hotspots[0];
  const data=openDemand({...h,demo:true},20);
  assert.deepEqual(data.location,{lat:17,lng:78});
  assert.equal(data.budget_context.type,'illustrative_scenario');
  assert.equal(data.source,'synthetic_demo');
});
test('India boundaries and empty reports are rejected before AI calls',()=>{
  assert.throws(()=>validateReport({text:'A large damaged road is here',category:'roads',lat:0,lng:0}),/coordinates/);
  assert.throws(()=>validateReport({text:'',category:'roads',lat:17,lng:78}),/Describe/);
});
