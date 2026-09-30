# Vajra

Vajra helps turn reports about local infrastructure into a clearer picture of what needs attention. A resident can describe an issue in text or by voice, choose its location, and keep a tracking ID. Related reports become demand signals that a planner can review alongside an **illustrative** budget.

**[Open the live site](https://vajra-wheat.vercel.app)** · [How it works](docs/HOW_IT_WORKS.md) · [Set up your own copy](docs/GETTING_STARTED.md)

This is a working prototype built for the [Build with AI: Code for Communities, Track 1](https://hack2skill.com/event/codeforcommunities2) hackathon. It is not a government grievance portal or a system that approves public spending.

## Try it

**As a resident:** Open the site, choose a category, describe the problem, and add the issue's location in India. You can record or upload a short voice note and attach a photo. Review the text before submitting. Save the tracking ID shown after submission; the [tracking page](https://vajra-wheat.vercel.app/status) uses it to show limited status.

**As a planner or reviewer:** Open the [planning studio](https://vajra-wheat.vercel.app/planner). The default view is a synthetic eight-state example: change the budget, switch between list and map, and open a signal to see why it ranks where it does. The **Live workspace** is separate and requires the planner passcode; it shows real submissions to this prototype. The passcode is deliberately absent from this repository.

The public example's reports, household figures, costs, and investment notes are invented for demonstration. A result marked “Included” means only that it fits the selected *scenario* budget. It is not a sanction, tender estimate, inspection finding, or promise of service.

## Run it locally

You will need Node.js 22, a Google AI Studio Gemini API key, and a Firebase project with Cloud Firestore. WhatsApp credentials, a Google Cloud billing account, and a payment card are **not** required for the web flow.

```bash
git clone https://github.com/Koushik-026/Vajra-Google-Cloud.git
cd Vajra-Google-Cloud
npm ci
cp .env.example .env.local
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`. Put your Gemini key and a strong `PLANNER_PASSCODE` in `.env.local`, and place your Firebase service-account JSON at `service-account.json` in the project root. Create the Firestore database and publish the supplied deny-all `firestore.rules`. The [step-by-step setup guide](docs/GETTING_STARTED.md) covers where to find each item and how to check the result. Then start the server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The synthetic planning studio works without a database; submitting and tracking a new report requires the Gemini and Firebase setup above.

## What the app does

1. The server validates the report and sends the description or voice note to Gemini for transcription and translation. An optional photo is checked for *relevance*, not authenticity.
2. A new report is compared with nearby reports in the same category. The prototype groups them when they are within 2 km and their embeddings reach a cosine similarity of 0.78.
3. A signal needs at least two related reports before it can enter the budget scenario. The planner can inspect the score, adjust the illustrative budget, and export a small demand-signal JSON record.

Read [How it works](docs/HOW_IT_WORKS.md) for the data flow, rules, API routes, privacy boundaries, and known limits. The [deployment guide](docs/DEPLOYMENT.md) explains Vercel and Firebase setup. The [hackathon notes](docs/hackathon-submission.md) contain a demo outline and evaluation plan, and the [submission checklist](docs/SUBMISSION.md) tracks the items required by the form.

## Checks

```bash
npm run lint
node --test test/*.test.mjs
npm run build
npm audit --omit=dev
```

The tests cover planning decisions and input validation. The production site was also checked with a synthetic report that was removed afterward. See [Contributing](docs/CONTRIBUTING.md) if you want to change the code.

## Limits to keep in mind

- The live database is capped at 200 reports and 200 demand signals. This is a pilot guard, not an India-scale architecture.
- Two related reports do not prove two different people submitted them, and an AI photo match does not prove an issue is real. Field review is essential.
- The public planning data is synthetic. The app does not yet ingest district-authorized population, asset, or scheme datasets.
- WhatsApp is optional and disabled in the current deployment. The web and voice flows work without it.
- Descriptions and optional media are sent to Gemini for processing. Please avoid entering names, phone numbers, faces, or other personal details.

The [public methodology page](https://vajra-wheat.vercel.app/methodology) explains the assumptions and sources in more detail.
