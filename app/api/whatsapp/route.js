// GET & POST /api/whatsapp — WhatsApp Cloud API Webhook Integration
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

// Use Gemini to categorize unstructured citizen WhatsApp complaints
async function classifyComplaintWithGemini(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "other";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `Classify this citizen infrastructure complaint into exactly ONE category from this list:
[roads, water_supply, sanitation, streetlights, drainage, health_facility, public_transport, solid_waste, other]

Complaint: "${text}"

Respond with ONLY the exact category name in lowercase (no punctuation, no markdown).`;

    const res = await model.generateContent(prompt);
    const cat = res.response.text().trim().toLowerCase();
    return CATEGORIES.includes(cat) ? cat : "other";
  } catch (err) {
    console.error("Gemini complaint categorization error:", err);
    return "other";
  }
}

// Send automated WhatsApp reply back to citizen
async function sendWhatsAppMessage(recipientPhone, messageText) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log(
      `[WhatsApp Cloud API Mock] Would send to ${recipientPhone}: ${messageText}`
    );
    return false;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
        type: "text",
        text: { body: messageText },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to send WhatsApp message:", err);
    return false;
  }
}

// GET /api/whatsapp — Webhook verification for Meta
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN || "vajra_whatsapp_secret_2026";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("WhatsApp webhook verified successfully!");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// POST /api/whatsapp — Process incoming WhatsApp messages
export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Check for Meta WhatsApp Cloud API webhook structure
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // 2. Allow simulated / direct payload for hackathon testing: { phone, text, lat, lng }
    let senderPhone = "";
    let messageText = "";
    let lat = 12.9716; // Default demo coordinates (Bengaluru tech / municipal center)
    let lng = 77.5946;

    if (message) {
      senderPhone = message.from;
      if (message.type === "text") {
        messageText = message.text?.body || "";
      } else if (message.type === "location") {
        lat = message.location?.latitude || lat;
        lng = message.location?.longitude || lng;
        messageText = message.location?.name || "Reported location from WhatsApp";
      } else {
        messageText = `Media message received (${message.type})`;
      }
    } else if (body.phone && body.text) {
      senderPhone = body.phone;
      messageText = body.text;
      if (body.lat != null) lat = body.lat;
      if (body.lng != null) lng = body.lng;
    } else {
      // Acknowledgment for other Meta event pings (e.g. status updates)
      return NextResponse.json({ status: "ignored" });
    }

    if (!messageText.trim()) {
      return NextResponse.json({ status: "empty_message" });
    }

    // AI Classification
    const category = await classifyComplaintWithGemini(messageText);

    // Create report document
    const reportRef = adminDb.collection("reports").doc();
    const reportData = {
      id: reportRef.id,
      text: messageText.trim(),
      category,
      lat,
      lng,
      status: "received",
      source: "whatsapp",
      sender_phone: senderPhone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      photo_verification: null,
    };

    await reportRef.set(reportData);

    // Trigger async processing pipeline (embeddings + clustering)
    const host = request.headers.get("host") || "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${proto}://${host}`;

    fetch(`${baseUrl}/api/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: reportRef.id }),
    }).catch((err) => console.error("Async process trigger error:", err));

    // Send confirmation reply back to citizen
    const replyText = `🙏 Namaste! Your infrastructure report has been received and verified by Vajra AI.

📌 Category: ${category.replace(/_/g, " ").toUpperCase()}
📋 Tracking ID: ${reportRef.id}

You can track your neighborhood cluster & funding status here:
${baseUrl}/status?id=${reportRef.id}

Thank you for helping build better digital public infrastructure! ⚡`;

    await sendWhatsAppMessage(senderPhone, replyText);

    return NextResponse.json({
      success: true,
      report_id: reportRef.id,
      category,
      message: "WhatsApp report processed and reply dispatched",
    });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing error", details: err.message },
      { status: 500 }
    );
  }
}
