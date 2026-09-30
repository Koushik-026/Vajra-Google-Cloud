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
  } else if (process.env.NODE_ENV !== 'production') {
    const serviceAccountPath = resolve(/*turbopackIgnore: true*/
      process.cwd(),
      process.env.GOOGLE_APPLICATION_CREDENTIALS || "./service-account.json"
    );
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    credential = cert(serviceAccount);
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is required in production');
  }

  return initializeApp({ credential });
}

// Route modules are imported during `next build`, before deployment secrets exist.
// Resolve Firestore only when a request actually uses it.
let db;
const adminDb = new Proxy({}, {
  get(_target, property) {
    db ??= getFirestore(getAdminApp());
    const value = db[property];
    return typeof value === 'function' ? value.bind(db) : value;
  },
});

export { adminDb };
