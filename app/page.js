"use client";

import { useState } from "react";
import ReportForm from "./components/ReportForm";
import ReportsList from "./components/ReportsList";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main style={{ maxWidth: "960px", margin: "0 auto", padding: "20px" }}>
      <h1>🔱 Vajra — Citizen Infrastructure Reporting</h1>
      <p>
        Report infrastructure problems in your area. Your report will be
        analyzed, verified, and grouped with similar reports to help planners
        prioritize spending.
      </p>
      <hr />

      <ReportForm onReportSubmitted={() => setRefreshKey((k) => k + 1)} />

      <hr style={{ margin: "32px 0" }} />

      <ReportsList refreshKey={refreshKey} />
    </main>
  );
}
