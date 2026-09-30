// Entirely synthetic scenarios. Coordinates identify cities, not actual complaints.
const cases=[
 ['hyderabad-water','water_supply',17.385,78.4867,6,'Hyderabad','Telangana','An intermittent water connection affects a lane of homes.',180,'Jal Jeevan Mission / urban water scheme review'],
 ['patna-drainage','drainage',25.5941,85.1376,7,'Patna','Bihar','A blocked drain floods the approach to a school after rain.',240,'AMRUT 2.0 / local drainage plan'],
 ['jaipur-roads','roads',26.9124,75.7873,5,'Jaipur','Rajasthan','A damaged connector road limits access to the bus stop.',120,'Local road plan / PMGSY eligibility review'],
 ['guwahati-health','health_facility',26.1445,91.7362,3,'Guwahati','Assam','Residents request an accessible approach to a primary health facility.',90,'National Health Mission / district plan'],
 ['kochi-waste','solid_waste',9.9312,76.2673,4,'Kochi','Kerala','Missed waste collection has created repeated dumping points.',150,'Swachh Bharat Mission / local service plan'],
 ['pune-light','streetlights',18.5204,73.8567,2,'Pune','Maharashtra','Streetlights are out on the walking route to a bus stop.',70,'Local streetlight maintenance plan'],
 ['bhopal-sanitation','sanitation',23.2599,77.4126,2,'Bhopal','Madhya Pradesh','A community toilet needs water and maintenance.',85,'Swachh Bharat Mission / local service plan'],
 ['ranchi-transit','public_transport',23.3441,85.3096,1,'Ranchi','Jharkhand','A resident requests a safer bus waiting area.',60,'State transport / local mobility plan']
];
export const DEMO_HOTSPOTS=cases.map(([id,category,lat,lng,corroboration_count,place,state,summary,households,investment_context])=>({id,category,lat,lng,corroboration_count,place,state,summary,households,investment_context,created_at:'2026-09-30T00:00:00.000Z',demo:true}));
export const DEMO_NOW=Date.parse('2026-09-30T12:00:00Z');
export const DEMO_REPORT_COUNT=DEMO_HOTSPOTS.reduce((n,h)=>n+h.corroboration_count,0);
