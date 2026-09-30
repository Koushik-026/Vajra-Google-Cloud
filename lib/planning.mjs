// Shared, deterministic scenario policy. All amounts are illustrative INR lakhs.
export const CATEGORY_LABELS = { water_supply: 'Water supply', health_facility: 'Health facilities', sanitation: 'Sanitation', drainage: 'Drainage', roads: 'Roads', solid_waste: 'Waste collection', public_transport: 'Public transport', streetlights: 'Streetlights', other: 'Other infrastructure' };
export const CATEGORY_WEIGHTS = { water_supply: 10, health_facility: 9, sanitation: 8, drainage: 7, roads: 6, solid_waste: 5, public_transport: 4, streetlights: 2, other: 3 };
export const CATEGORY_COSTS = { water_supply: 15, health_facility: 25, sanitation: 12, drainage: 10, roads: 20, solid_waste: 8, public_transport: 18, streetlights: 5, other: 10 };
export function scoreHotspot(h, now = Date.now()) {
  const age = Math.max(0, (now - new Date(h.created_at || now).getTime()) / 86400000);
  const recency = Math.max(0.5, 1 - (Number.isFinite(age) ? age : 0) / 90);
  return Math.round((CATEGORY_WEIGHTS[h.category] || 3) * (h.corroboration_count || 1) * recency * 100) / 100;
}
export function allocate(hotspots, budget, now = Date.now()) {
  if (!Number.isFinite(budget) || budget < 0 || budget > 10000) throw new Error('Budget must be between 0 and 10,000 lakhs.');
  let allocated = 0;
  const ranked = hotspots.map(h => ({ ...h, priority_score: scoreHotspot(h, now), cost: CATEGORY_COSTS[h.category] || 10 }))
    .sort((a,b) => b.priority_score - a.priority_score || a.id.localeCompare(b.id));
  const result = ranked.map(h => {
    const eligible = h.corroboration_count >= 2;
    const funded = eligible && allocated + h.cost <= budget;
    if (funded) allocated += h.cost;
    return { ...h, eligible, funding_status: funded ? 'funded' : 'queued', sample_budget_used: funded ? h.cost : 0,
      decision_reason: !eligible ? 'Awaiting a second related report' : funded ? 'Fits the budget in priority order' : 'Exceeds the remaining scenario budget' };
  });
  return { hotspots: result, total_budget: budget, allocated_so_far: allocated, remaining: budget - allocated };
}
export function cosine(a,b) {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length) return 0;
  let dot=0, aa=0, bb=0;
  for(let i=0;i<a.length;i++){ dot+=a[i]*b[i]; aa+=a[i]*a[i]; bb+=b[i]*b[i]; }
  return aa && bb ? dot/Math.sqrt(aa*bb) : 0;
}
export function distanceKm(a,b) {
  const rad = n => n*Math.PI/180;
  const d = Math.sin(rad(b.lat-a.lat)/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lng-a.lng)/2)**2;
  return 6371*2*Math.asin(Math.sqrt(Math.min(1,d)));
}
export function validateReport(body) {
  if (typeof body.text !== 'string' || body.text.trim().length < 10 || body.text.length > 3000) throw new Error('Describe the issue in 10–3,000 characters.');
  if (!Object.hasOwn(CATEGORY_LABELS, body.category)) throw new Error('Select a valid infrastructure category.');
  if (!Number.isFinite(body.lat) || !Number.isFinite(body.lng) || body.lat < 6 || body.lat > 38 || body.lng < 68 || body.lng > 98) throw new Error('Choose valid coordinates in India.');
  return { text: body.text.trim(), category: body.category, lat: body.lat, lng: body.lng };
}
export function openDemand(h, budget) {
  return { schema_version:'vajra-open-demand-v1', hotspot_id:h.id, country:'IN', category:h.category,
    location:{lat:h.lat,lng:h.lng}, corroboration_count:h.corroboration_count, priority_score:h.priority_score,
    funding_status:h.funding_status, budget_context:{type:'illustrative_scenario',currency:'INR',unit:'lakh',total_budget:budget,estimated_cost:h.cost ?? CATEGORY_COSTS[h.category]},
    verification_basis:'Related reports, not identity or field verification', source:h.demo ? 'synthetic_demo' : 'citizen_reports' };
}
