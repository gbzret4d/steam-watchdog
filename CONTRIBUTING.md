# Contributing to Steam Dev Filter

Thank you for helping to keep Steam safe!

## Reporting a Developer

We maintain a strict **No Proof, No Entry** policy. We do not support witch hunts or personal vendettas.

### Rules for Reports
1. **Evidence is Mandatory**: You must provide a link to a verifiable source (Archive.org, YouTube investigation, Steam Community post, Official Statement).
2. **Be Objective**: Stick to the facts. "I don't like this game" is not a valid reason.
3. **Check for Duplicates**: Search existing issues and the database before reporting.

### How to Report
1. Go to the [Issues](../../issues) tab.
2. Click "New Issue" and select "Report Scammer".
3. Fill out the form completely.

## Definition of Categories

- **RUG_PULL**: Clear evidence that the developer collected sales/funding and abandoned the project immediately or shortly after, often deleting social media or ghosting the community.
- **ASSET_FLIP**: The game consists almost entirely of pre-bought assets with little to no original logic or design, often sold for a quick cash grab.
- **ABANDONWARE**: Only applies to **Early Access** titles that have not received a significant update in over 12 months without valid explanation.
- **HOSTILE_DEV**: Documented cases of devs banning users for negative reviews, making legal threats against reviewers, or using hate speech.

## For Developers (Code Contributions)

1. Fork the repository.
2. Clone your fork.
3. checkout the `develop` branch.
4. Make your changes to the userscript or automation workflows.
5. Run tests (if applicable).
6. Open a Pull Request targeting the `develop` branch.

**Note:** The `main` branch is for stable releases only. All development happens on `develop`.

### Database Validation
All changes to `database.json` are automatically validated by GitHub Actions. Ensure your JSON is valid and includes all required fields (`proof_url` is critical!).
