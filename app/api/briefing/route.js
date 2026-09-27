import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      hotspot_id,
      category,
      priority_score,
      corroboration_count,
      location,
      funding_status,
      sample_reports,
    } = body;

    let reportTexts = sample_reports || [];

    // If sample reports not provided, fetch up to 3 reports from Firestore
    if (!reportTexts.length && hotspot_id) {
      try {
        const snap = await adminDb
          .collection("reports")
          .where("hotspot_id", "==", hotspot_id)
          .limit(3)
          .get();

        reportTexts = snap.docs.map((d) => d.data().translated_text || d.data().text).filter(Boolean);
      } catch (err) {
        console.warn("Could not fetch reports for briefing:", err.message);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        briefing: `Municipal cluster in ${category || "infrastructure"} sector with ${corroboration_count || 1} verified citizen complaint(s). Corroborated priority score is ${(priority_score || 0).toFixed(1)}, currently designated as ${funding_status || "queued"}. Immediate field engineering assessment is advised to inspect physical structural integrity and safeguard public accessibility.`,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const reportsContext = reportTexts.length
      ? reportTexts.map((t, idx) => `Complaint ${idx + 1}: "${t}"`).join("\n")
      : "Citizen complaints highlight repeated infrastructure breakdown and accessibility hazards.";

    const prompt = `You are an expert municipal infrastructure strategist and urban planner.
Generate a concise, professional 3-5 sentence executive briefing for a city municipal commissioner regarding this infrastructure hotspot:

- Infrastructure Sector: ${category || "General Infrastructure"}
- Community Corroboration: ${corroboration_count || 1} citizen complaints clustered within 2km proximity
- Algorithmic Priority Score: ${(priority_score || 0).toFixed(1)}
- Municipal Funding Status: ${funding_status || "Queued"}
- Geolocation: Lat ${location?.lat || 12.97}, Lng ${location?.lng || 77.59}
- Sample Citizen Reports:
${reportsContext}

The briefing MUST address:
1. Summary of the underlying infrastructure failure pattern.
2. Affected civic corridor, commuter safety, or public health impact.
3. Recommended priority municipal intervention (e.g. rapid patching, culvert clearance, or emergency tender).

Keep it strictly between 3 to 5 sentences. Write as a continuous, high-density executive paragraph without markdown bullet points or asterisks.`;

    const result = await model.generateContent(prompt);
    const briefing = result.response.text().trim();

    return NextResponse.json({
      success: true,
      briefing,
    });
  } catch (error) {
    console.error("AI Briefing generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate AI planner briefing",
        briefing: "AI briefing service temporarily unavailable. Recommended action: verify physical hotspot location and dispatch ward engineer for ground assessment.",
      },
      { status: 500 }
    );
  }
}
