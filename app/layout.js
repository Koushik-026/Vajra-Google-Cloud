import "./globals.css";

export const metadata = {
  title: "Vajra — Citizen Infrastructure Reporting",
  description:
    "Report infrastructure problems. AI-powered deduplication turns citizen feedback into prioritized, budget-aware action plans for government planners.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
