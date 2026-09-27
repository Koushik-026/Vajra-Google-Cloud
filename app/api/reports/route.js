// POST /api/reports — creates a new report in Firestore
// This uses the Admin SDK so we can control the document structure exactly
import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CATEGORIES = [
  "roads",
  "water_supply",
  "sanitation",
  "streetlights",
  "drainage",
  "health_facility",
  "public_transport",
  "solid_waste",
  "other",
];

async function verifyPhotoWithGemini(photoBase64, mimeType, reportCategory) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType,
        data: photoBase64,
      },
    },
    {
      text: `You are verifying a citizen infrastructure complaint photo.
The citizen categorized this complaint as: "${reportCategory}".
Does this photo actually show an issue related to "${reportCategory}"?

Respond ONLY with a valid JSON object (no markdown, no code fences):
{"matches_category": "yes" | "no" | "unsure", "confidence": 0.0 to 1.0, "reasoning": "brief explanation"}`,
    },
  ]);

  const text = result.response.text().trim();
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse Gemini photo verification:", text);
    return { matches_category: "unsure", confidence: 0, reasoning: "Parse error" };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { text, category, lat, lng, photo, photoMimeType, language } = body;

    // Validate required fields
    if (!text || !category || lat == null || lng == null) {
      return NextResponse.json(
        { error: "Missing required fields: text, category, lat, lng" },
        { status: 400 }
      );
    }

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Photo verification (if photo provided)
    let photoVerification = { checked: false };
    if (photo && photoMimeType) {
      const verification = await verifyPhotoWithGemini(
        photo,
        photoMimeType,
        category
      );
      if (verification) {
        photoVerification = {
          checked: true,
          matches_category: verification.matches_category,
          confidence: verification.confidence,
          checked_at: new Date().toISOString(),
        };
      }
    }

    // Build the report document — exact schema from Part 3
    const reportData = {
      text: text,
      translated_text: text, // For web form (English), same as text. Gemini translation used for WhatsApp voice.
      category: category,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      photo_url: photo ? "inline_base64" : null, // In production, upload to storage. For demo, we note it was provided.
      language: language || "en",
      source: "web",
      status: "received",
      hotspot_id: null,
      created_at: new Date().toISOString(),
      photo_verification: photoVerification,
    };

    const docRef = await adminDb.collection("reports").add(reportData);

    // Fire-and-forget: trigger AI processing (embedding, clustering, prioritization)
    // This runs asynchronously so the citizen doesn't wait for it
    const baseUrl = request.headers.get("x-forwarded-proto")
      ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
      : `http://${request.headers.get("host") || "localhost:3000"}`;

    fetch(`${baseUrl}/api/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: docRef.id }),
    }).catch((err) => console.error("Background processing error:", err));

    return NextResponse.json(
      { id: docRef.id, status: "received", message: "Report submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/reports — list all reports (for the planner dashboard)
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("reports")
      .orderBy("created_at", "desc")
      .limit(100)
      .get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports", details: error.message },
      { status: 500 }
    );
  }
}
