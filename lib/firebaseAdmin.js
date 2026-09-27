// Firebase Admin SDK — used by API routes (server-side only)
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // In production (Vercel), use FIREBASE_SERVICE_ACCOUNT env var (JSON string)
  // Locally, read from file
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credential = cert(serviceAccount);
  } else {
    const serviceAccountPath = resolve(
      process.cwd(),
      process.env.GOOGLE_APPLICATION_CREDENTIALS || "./service-account.json"
    );
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    credential = cert(serviceAccount);
  }

  return initializeApp({ credential });
}

const adminApp = getAdminApp();
const adminDb = getFirestore(adminApp);

export { adminDb };
