// GET/PUT /api/budget — manage the budget pool
import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const doc = await adminDb.collection("budget_pool").doc("current").get();

    if (!doc.exists) {
      // Initialize with default
      const defaultBudget = { total_budget: 100, allocated_so_far: 0 };
      await adminDb.collection("budget_pool").doc("current").set(defaultBudget);
      return NextResponse.json(defaultBudget);
    }

    return NextResponse.json(doc.data());
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { total_budget } = body;

    if (total_budget == null || total_budget < 0) {
      return NextResponse.json(
        { error: "total_budget must be a non-negative number" },
        { status: 400 }
      );
    }

    await adminDb.collection("budget_pool").doc("current").set(
      { total_budget: parseFloat(total_budget) },
      { merge: true }
    );

    return NextResponse.json({ success: true, total_budget: parseFloat(total_budget) });
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Failed to update budget", details: error.message },
      { status: 500 }
    );
  }
}
