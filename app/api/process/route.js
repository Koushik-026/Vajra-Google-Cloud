// POST /api/process — AI processing: embedding, clustering into hotspots, priority scoring, budget allocation
// Called after a new report is created. Can also be called manually to re-process all.
import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Category weights: higher = more urgent infrastructure need
const CATEGORY_WEIGHTS = {
  water_supply: 10,
  health_facility: 9,
  sanitation: 8,
  drainage: 7,
  roads: 6,
  solid_waste: 5,
  public_transport: 4,
  streetlights: 2,
  other: 3,
};

// Illustrative cost estimates per hotspot (INR lakhs)
const CATEGORY_COSTS = {
  water_supply: 15,
  health_facility: 25,
  sanitation: 12,
  drainage: 10,
  roads: 20,
  solid_waste: 8,
  public_transport: 18,
  streetlights: 5,
  other: 10,
};

const SIMILARITY_THRESHOLD = 0.78; // Cosine similarity threshold for merging
const PROXIMITY_KM = 2; // Max distance in km to consider same hotspot

async function getEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function processReport(reportId) {
  const reportDoc = await adminDb.collection("reports").doc(reportId).get();
  if (!reportDoc.exists) throw new Error(`Report ${reportId} not found`);

  const report = { id: reportDoc.id, ...reportDoc.data() };

  // 1. Generate embedding for this report
  const reportText = `${report.category}: ${report.translated_text || report.text}`;
  const embedding = await getEmbedding(reportText);

  // Store embedding on the report
  await adminDb.collection("reports").doc(reportId).update({
    embedding: embedding,
  });

  // 2. Find matching hotspot
  const hotspotsSnapshot = await adminDb.collection("hotspots").get();
  let bestMatch = null;
  let bestSimilarity = 0;

  for (const hotspotDoc of hotspotsSnapshot.docs) {
    const hotspot = { id: hotspotDoc.id, ...hotspotDoc.data() };

    // Check location proximity first (fast filter)
    const dist = haversineKm(report.lat, report.lng, hotspot.lat, hotspot.lng);
    if (dist > PROXIMITY_KM) continue;

    // Check category match
    if (hotspot.category !== report.category) continue;

    // Check text similarity via embedding
    if (hotspot.embedding) {
      const similarity = cosineSimilarity(embedding, hotspot.embedding);
      if (similarity > bestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
        bestSimilarity = similarity;
        bestMatch = hotspot;
      }
    }
  }

  const batch = adminDb.batch();

  if (bestMatch) {
    // 3a. Merge into existing hotspot
    const newCount = (bestMatch.corroboration_count || 1) + 1;

    // Update centroid as weighted average
    const totalReports = newCount;
    const newLat =
      (bestMatch.lat * (totalReports - 1) + report.lat) / totalReports;
    const newLng =
      (bestMatch.lng * (totalReports - 1) + report.lng) / totalReports;

    const hotspotRef = adminDb.collection("hotspots").doc(bestMatch.id);
    batch.update(hotspotRef, {
      corroboration_count: newCount,
      lat: newLat,
      lng: newLng,
      updated_at: new Date().toISOString(),
    });

    // Link report to hotspot
    const reportRef = adminDb.collection("reports").doc(reportId);
    batch.update(reportRef, { hotspot_id: bestMatch.id });

    // If 2+ corroborations, mark all linked reports as "verified"
    if (newCount >= 2) {
      const linkedReports = await adminDb
        .collection("reports")
        .where("hotspot_id", "==", bestMatch.id)
        .get();

      for (const doc of linkedReports.docs) {
        if (doc.data().status === "received") {
          batch.update(doc.ref, { status: "verified" });
        }
      }
      // Also mark this report as verified
      batch.update(reportRef, { status: "verified" });
    }

    await batch.commit();
    return { action: "merged", hotspot_id: bestMatch.id, similarity: bestSimilarity };
  } else {
    // 3b. Create new hotspot
    const hotspotRef = adminDb.collection("hotspots").doc();
    batch.set(hotspotRef, {
      category: report.category,
      lat: report.lat,
      lng: report.lng,
      corroboration_count: 1,
      priority_score: 0,
      funding_status: "queued",
      sample_budget_used: 0,
      embedding: embedding,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Link report to hotspot
    const reportRef = adminDb.collection("reports").doc(reportId);
    batch.update(reportRef, { hotspot_id: hotspotRef.id });

    await batch.commit();
    return { action: "created", hotspot_id: hotspotRef.id };
  }
}

function computePriorityScore(hotspot) {
  const categoryWeight = CATEGORY_WEIGHTS[hotspot.category] || 3;
  const corroboration = hotspot.corroboration_count || 1;

  // Recency factor: newer hotspots get a slight boost
  const ageMs = Date.now() - new Date(hotspot.created_at || Date.now()).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0.5, 1 - ageDays / 90); // Decays over 90 days to min 0.5

  return categoryWeight * corroboration * recencyFactor;
}

async function runPrioritization() {
  const hotspotsSnapshot = await adminDb.collection("hotspots").get();
  const batch = adminDb.batch();

  for (const doc of hotspotsSnapshot.docs) {
    const hotspot = { id: doc.id, ...doc.data() };
    const score = computePriorityScore(hotspot);
    batch.update(doc.ref, { priority_score: Math.round(score * 100) / 100 });
  }

  await batch.commit();
}

async function runBudgetAllocation() {
  // Get budget pool
  const budgetDoc = await adminDb
    .collection("budget_pool")
    .doc("current")
    .get();

  let totalBudget = 100; // Default 100 lakhs
  if (budgetDoc.exists) {
    totalBudget = budgetDoc.data().total_budget || 100;
  } else {
    // Create default budget document
    await adminDb.collection("budget_pool").doc("current").set({
      total_budget: 100,
      allocated_so_far: 0,
    });
  }

  // Get all hotspots ranked by priority
  const hotspotsSnapshot = await adminDb
    .collection("hotspots")
    .orderBy("priority_score", "desc")
    .get();

  let allocated = 0;
  const batch = adminDb.batch();

  for (const doc of hotspotsSnapshot.docs) {
    const hotspot = doc.data();
    const cost = CATEGORY_COSTS[hotspot.category] || 10;

    if (allocated + cost <= totalBudget) {
      batch.update(doc.ref, {
        funding_status: "funded",
        sample_budget_used: cost,
      });
      allocated += cost;

      // Update linked reports to "funded"
      const linkedReports = await adminDb
        .collection("reports")
        .where("hotspot_id", "==", doc.id)
        .get();
      for (const reportDoc of linkedReports.docs) {
        if (["received", "verified"].includes(reportDoc.data().status)) {
          batch.update(reportDoc.ref, { status: "funded" });
        }
      }
    } else {
      batch.update(doc.ref, {
        funding_status: "queued",
        sample_budget_used: 0,
      });

      // Update linked reports to "queued"
      const linkedReports = await adminDb
        .collection("reports")
        .where("hotspot_id", "==", doc.id)
        .get();
      for (const reportDoc of linkedReports.docs) {
        if (reportDoc.data().status === "funded") {
          batch.update(reportDoc.ref, { status: "queued" });
        }
      }
    }
  }

  // Update allocated total
  batch.update(adminDb.collection("budget_pool").doc("current"), {
    allocated_so_far: allocated,
  });

  await batch.commit();
  return { total_budget: totalBudget, allocated_so_far: allocated };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { report_id, action } = body;

    let result = {};

    if (action === "reprocess_all") {
      // Re-run prioritization and budget allocation on all hotspots
      await runPrioritization();
      const budget = await runBudgetAllocation();
      result = { action: "reprocessed", budget };
    } else if (action === "reallocate") {
      // Just re-run budget allocation (used by the budget slider)
      const budget = await runBudgetAllocation();
      result = { action: "reallocated", budget };
    } else if (report_id) {
      // Process a single new report
      const processResult = await processReport(report_id);

      // Re-run prioritization and budget allocation
      await runPrioritization();
      const budget = await runBudgetAllocation();

      result = { ...processResult, budget };
    } else {
      return NextResponse.json(
        { error: "Provide report_id or action" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Processing error:", error);
    return NextResponse.json(
      { error: "Processing failed", details: error.message },
      { status: 500 }
    );
  }
}
