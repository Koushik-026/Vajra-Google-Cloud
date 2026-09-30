# Contributing

Thanks for taking a look at Vajra. It is a small prototype, so clear problem reports and modest, testable changes are more useful than a large rewrite.

## Before changing code

Read the [README](../README.md) and [How it works](HOW_IT_WORKS.md). If your idea changes how reports are grouped, ranked, or shown to residents, explain the real-world case it handles and what could go wrong. A nearby report can still be unrelated; a high score does not mean a government project is approved.

Good places to help include accessibility, clearer Hindi and Telugu copy, testing with additional Indian languages, better low-bandwidth behavior, labeled evaluation examples for clustering, and a safer data-retention flow. Please do not add an unverified “impact” number or silently replace synthetic demo data with unreviewed statistics.

## Local workflow

1. Follow [Getting started](GETTING_STARTED.md) with your **own** Firebase project and Gemini key.
2. Create a short branch from the latest repository state.
3. Make the smallest change that addresses the issue. Keep public demo data visibly synthetic and planner data private.
4. Run the checks:

   ```bash
   npm run lint
   node --test test/*.test.mjs
   npm run build
   ```

5. If you changed a page, check it at a narrow mobile width and on desktop. If you changed report processing or allocation, include a test that would fail for the old behavior.
6. Open a pull request describing the problem, what changed, how you tested it, and any effect on stored data or credentials.

Use clearly labeled synthetic reports for testing. Do not copy real citizen text, location histories, phone numbers, API keys, or service-account JSON into commits, issues, screenshots, or pull requests. The ignored `.env.local` and `service-account.json` files should remain local.

## Notes on scope

The current application has a 200-report pilot cap and a shared planner passcode. Changes that remove the cap, expose live reports publicly, or alter Firestore security rules need particular care and should include a migration or validation plan. WhatsApp support is optional; contributors should not require Meta credentials for the web experience.

This repository is public but **does not have a reuse license yet**, by the maintainer's choice. Public visibility alone does not grant permission to redistribute or reuse the code outside GitHub's terms. Please contact the maintainer before using it in another project.
