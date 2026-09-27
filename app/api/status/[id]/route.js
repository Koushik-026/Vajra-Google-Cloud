// GET /api/status/[id] — citizen report status lookup
import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    const doc = await adminDb.collection("reports").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const report = doc.data();

    // Only return safe fields — no internal data like embeddings
    const safeData = {
      id: doc.id,
      category: report.category,
      status: report.status,
      created_at: report.created_at,
      hotspot_id: report.hotspot_id,
      photo_verification: report.photo_verification?.checked
        ? {
            matches_category: report.photo_verification.matches_category,
            confidence: report.photo_verification.confidence,
          }
        : null,
    };

    // If report is linked to a hotspot, include hotspot info
    if (report.hotspot_id) {
      const hotspotDoc = await adminDb
        .collection("hotspots")
        .doc(report.hotspot_id)
        .get();

      if (hotspotDoc.exists) {
        const hotspot = hotspotDoc.data();
        safeData.hotspot = {
          corroboration_count: hotspot.corroboration_count,
          priority_score: hotspot.priority_score,
          funding_status: hotspot.funding_status,
        };
      }
    }

    return NextResponse.json(safeData);
  } catch (error) {
    console.error("Error looking up report:", error);
    return NextResponse.json(
      { error: "Failed to look up report", details: error.message },
      { status: 500 }
    );
  }
}
