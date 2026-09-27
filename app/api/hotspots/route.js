// GET /api/hotspots — list all hotspots for the planner dashboard
import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("hotspots")
      .orderBy("priority_score", "desc")
      .get();

    const hotspots = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Don't send embeddings to the frontend (too large)
      const { embedding, ...rest } = data;
      return { id: doc.id, ...rest };
    });

    return NextResponse.json({ hotspots });
  } catch (error) {
    console.error("Error fetching hotspots:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotspots", details: error.message },
      { status: 500 }
    );
  }
}
