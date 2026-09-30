# Getting started

This guide is for someone who wants to run their own Vajra instance. If you only want to explore the idea, visit the [live site](https://vajra-wheat.vercel.app) and open the planning studio. Its default data is synthetic, so you do not need an account or an API key to try the budget slider.

## 1. Prepare the tools

Install [Node.js 22](https://nodejs.org/) and npm. You will also need:

- a [Gemini API key from Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key);
- a [Firebase project](https://firebase.google.com/docs/projects/learn-more) with a Cloud Firestore **default database**;
- a [Firebase Admin service-account JSON file](https://firebase.google.com/docs/admin/setup).

The web app does not require a WhatsApp account, Google Flow credentials, or a payment card. Google's free-tier quotas can change, so check your own [Gemini usage](https://ai.google.dev/gemini-api/docs/rate-limits) and [Firestore limits](https://firebase.google.com/docs/firestore/quotas) before inviting others to submit reports.

## 2. Get the code

```bash
git clone https://github.com/Koushik-026/Vajra-Google-Cloud.git
cd Vajra-Google-Cloud
npm ci
```

`npm ci` uses the committed lockfile. If it fails, confirm that `node --version` reports version 22.

## 3. Set up Firestore

In the Firebase console, create a project and create its default Cloud Firestore database in Native mode. Pick a region deliberately; Firestore location is not a setting you should casually change later. The [Firestore setup guide](https://firebase.google.com/docs/firestore/quickstart) walks through the console.

Open **Project settings → Service accounts → Generate new private key**. Save the downloaded JSON file in this repository's root as `service-account.json`. This key gives the server privileged database access. Keep it private and do not send it in an issue, commit, screenshot, or chat. The filename is gitignored.

The browser is not supposed to connect to Firestore directly. Publish the repository's `firestore.rules`, which denies browser reads and writes; Vajra's validated server routes use the Admin SDK. One way is the [Firebase CLI](https://firebase.google.com/docs/cli):

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID
```

Replace `YOUR_FIREBASE_PROJECT_ID` with the ID shown in Project settings. Review the rules in the Firebase console after deployment. Do not leave Firestore's temporary “allow everyone” test rule active.

## 4. Set local environment values

Copy the example file:

```bash
cp .env.example .env.local
```

In PowerShell, `Copy-Item .env.example .env.local` does the same thing. Edit `.env.local` and replace the Gemini placeholder with your own key. Choose a long, random planner passcode. Keep `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json` if you used the filename above. Leave `FIREBASE_SERVICE_ACCOUNT` blank locally; the app reads the file in development.

| Setting | Needed locally? | What it does |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes for new reports and voice | Calls Gemini from server routes |
| `GEMINI_MODEL` | No | Defaults to `gemini-3.5-flash-lite` |
| `PLANNER_PASSCODE` | Yes for the live planner | Signs the private planner session |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes if the JSON is not at the default path | Points to the local service-account file |
| `FIREBASE_SERVICE_ACCOUNT` | No in development | Full JSON string for production hosting |
| `WHATSAPP_*` | No | Optional integration; leave unset |

No `NEXT_PUBLIC_FIREBASE_*` values are needed. Keep all credentials server-side.

## 5. Start and use Vajra

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To check the app in a useful order:

1. Open **For planners**. Change the budget in **Explore demo**. The example should work even before you submit a report.
2. Open **For citizens**. In your own test project, submit a clearly labeled test issue with at least ten characters, one category, and coordinates inside India. Save the tracking ID. Avoid real names, phone numbers, or faces.
3. Open **Track a report** and paste the ID. A new report may show `pending` briefly while its embedding and cluster are prepared.
4. Open **Live workspace** and enter the passcode from your local `.env.local`. This shows reports in *your* Firestore project, not the synthetic examples. The same page lets a planner retry a report if processing failed after it was saved.

Voice recording needs microphone permission and a browser that supports `MediaRecorder`. If that is unavailable, upload a supported short audio file or type the report. Use the issue's location, not a home address.

## 6. Run checks

```bash
npm run lint
node --test test/*.test.mjs
npm run build
npm audit --omit=dev
```

The tests check planning rules and basic validation. They do not replace checking a real submission against your own Gemini key and Firestore project.

## Common problems

| Symptom | Check |
| --- | --- |
| Report returns “service unavailable” | Confirm the Gemini key is valid for the selected model, free quota remains, and the Firestore service account belongs to the intended project. A temporary model 503 can also occur; retry later. |
| Firestore permission or credential error | Confirm the JSON path or `FIREBASE_SERVICE_ACCOUNT` value. Server Admin access depends on service-account permissions, not browser rules. |
| Report is saved but remains pending | Wait briefly, then use the planner's retry action. Check server logs for a model or Firestore error. |
| Planner sign-in fails | Check `PLANNER_PASSCODE`, restart the dev server after editing `.env.local`, and avoid sharing the passcode publicly. |
| Public studio looks different from live workspace | That is intentional: public examples are synthetic and live reports are private. |
| Map tiles do not appear | Check network access to the map tiles; the list view remains usable. |

For hosting and post-deploy checks, continue with [Deployment](DEPLOYMENT.md). For the calculations and data boundaries, read [How it works](HOW_IT_WORKS.md).
