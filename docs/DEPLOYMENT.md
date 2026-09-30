# Deploying Vajra

The current public site is [vajra-wheat.vercel.app](https://vajra-wheat.vercel.app). It runs Next.js on Vercel, uses a server-side Gemini API key, and stores live reports in Cloud Firestore. The public planning example is bundled with the code; the live report flow needs the services below.

This guide is for deploying **your own copy**. Do not reuse the current site's credentials or planner passcode.

## Before deploying

1. Complete [Getting started](GETTING_STARTED.md) with your own Gemini key and Firebase project.
2. Create Cloud Firestore and deploy the repository's `firestore.rules` to that project. Vercel cannot publish Firebase rules for you.
3. Run `npm run lint`, `node --test test/*.test.mjs`, and `npm run build` locally.
4. Decide who may use the private planner workspace. A shared passcode is a pilot measure, not staff identity management.

The app declares Node.js 22 in `package.json`. Use that runtime when creating a hosting project.

## Create the Vercel project

The most straightforward route is to import the GitHub repository from the [Vercel dashboard](https://vercel.com/new). Select Next.js, keep the repository root as the project root, and use the default build settings. You can also use the [Vercel CLI](https://vercel.com/docs/cli):

```bash
npx vercel link
npx vercel deploy --prod
```

Set environment variables **before the production deployment you intend to use**. Changes to Vercel environment variables are applied to new deployments, so redeploy after adding or rotating a secret.

| Name | Environment | Value |
| --- | --- | --- |
| `GEMINI_API_KEY` | Production | A valid Google AI Studio key |
| `FIREBASE_SERVICE_ACCOUNT` | Production | The complete service-account JSON for your Firebase project |
| `PLANNER_PASSCODE` | Production | A strong, private passcode chosen for this deployment |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-3.5-flash-lite` |

In Vercel's project settings, add the first three as **sensitive/secret** values. Do not prefix them with `NEXT_PUBLIC_`, put the JSON file in the source tree sent to Vercel, or paste secret values into a GitHub issue or command line that records shell history. The app reads `FIREBASE_SERVICE_ACCOUNT` only on the server. `GOOGLE_APPLICATION_CREDENTIALS` is for local file-based development and is not needed on Vercel.

WhatsApp variables are deliberately absent from the current deployment. Leave them unset if you do not have a Meta Cloud API setup. `APP_URL` is only used to add a tracking link to optional WhatsApp replies.

## Deploy Firestore rules separately

From a checkout containing `firebase.json` and `firestore.rules`:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID
```

The rule file denies direct client reads and writes. This is intentional: the browser calls Next.js routes, and those routes use the Firebase Admin SDK. Check the **active** rule in the Firebase console after deploying it. A permissive Firestore test rule would expose report text and coordinates even if the website itself were well protected.

## Check the deployed site

Visit the production domain in a signed-out browser:

1. The home page, public planning example, methodology, and map/list should load without a Vercel login.
2. The **Live workspace** should ask for a planner passcode. An unsigned request to `/api/reports` or `/api/hotspots` should return 401.
3. Sign in with the private passcode and check that the live workspace loads from your Firebase project.
4. In a **dedicated test project**, submit a clearly marked synthetic report through the site and check its receipt on `/status`. Wait for processing to finish. Do not use a real person's details for a deployment smoke test.
5. Check Vercel function logs for errors and AI Studio/Firebase dashboards for quota use. A model 503 can be temporary; a 429 generally indicates a quota or rate limit.

The current Vajra deployment passed those checks with a synthetic report, which was removed from its test run. It also has a verified deny-all Firestore client rule. The [methodology page](https://vajra-wheat.vercel.app/methodology) and [How it works](HOW_IT_WORKS.md) explain why that does not make it ready for government use.

## Operating a small pilot

- Watch [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [Firestore free quotas](https://firebase.google.com/docs/firestore/quotas), Vercel function failures, and reports marked `retry_needed`. The free tier is useful for a demonstration, not a promise of unlimited use.
- Keep the planner passcode private. Changing `PLANNER_PASSCODE` invalidates existing signed sessions; redeploy to use the new value.
- If a Gemini key or Firebase service-account key is exposed, rotate it at its source, replace the Vercel secret, redeploy, and revoke the old key.
- Do not manually delete a live report without considering its hotspot count and budget state. The current app has no resident deletion or retention workflow. Add those before a real public pilot.
- The 200-report/200-hotspot limit is built into the transaction design. Do not remove the cap without redesigning clustering and allocation.

For the current deployment, the production domain is public even though generated deployment URLs may be protected by Vercel Authentication. Share the production domain with reviewers.
