// Firestore Security Rules for Vajra
// Deploy these in the Firebase Console → Firestore → Rules tab
//
// Citizens can only CREATE new reports (not read/edit/delete others').
// Server-side (Admin SDK) bypasses rules, so hotspots and budget_pool
// writes work fine from API routes.
// Hotspots and budget_pool are readable by anyone (public demo data).

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Reports: citizens can create, but not read/update/delete
    match /reports/{reportId} {
      allow create: if true;
      allow read, update, delete: if false;
    }

    // Hotspots: public read for the dashboard, no client writes
    match /hotspots/{hotspotId} {
      allow read: if true;
      allow write: if false;
    }

    // Budget pool: public read for the dashboard, no client writes
    match /budget_pool/{docId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
*/

// ☝️ Copy the rules_version block above (without the JS comment markers)
// into your Firebase Console → Firestore Database → Rules tab → Publish.
