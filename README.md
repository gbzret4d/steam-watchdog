# Steam Dev Filter

Steam Dev Filter is a community-driven database and Userscript designed to protect Steam users from fraudulent developers, scam projects, and abandoned early access games.

It adds a visible warning badge next to developer names on the Steam Store, helping you make informed purchasing decisions.

## Features

- **Community Driven**: Powered by a public `database.json` of verified reports.
- **Visual Warnings**: Adds color-coded badges to store pages (Rug Pull, Asset Flip, etc.).
- **Evidence Based**: Every entry requires a public proof link.
- **Privacy Friendly**: Runs entirely in your browser. Data is cached locally to minimize traffic.

## Installation

1. Install a Userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Click here to install the script: [**Install Steam Dev Filter**](steam_dev_filter.user.js) (or manually load `steam_dev_filter.user.js`).
3. Visit any Steam store page to see it in action.

## Categories

| Badge | Type | Description |
|:---:|:---|:---|
| 💸 | **RUG_PULL** | Took money and stopped development/vanished. |
| 🗑️ | **ASSET_FLIP** | Low-effort game using primarily store assets. |
| ☣️ | **MALICIOUS** | Malware, Crypto miners, or banned by Valve. |
| 🕸️ | **ABANDONWARE** | Early Access with no updates for >1 year. |
| 🤐 | **HOSTILE_DEV** | Legal threats, banning critics, toxicity. |
| 🚧 | **BROKEN_PROMISES** | Features promised (Roadmap/Kickstarter) never delivered. |

## How to Contribute

This project relies on the community to report bad actors.

- **Found a scammer?** [Submit a Report](https://github.com/USERNAME/steam-dev-filter/issues/new/choose)
- **Found a mistake?** Open an issue to request a correction.
- **Developer?** Check out [CONTRIBUTING.md](CONTRIBUTING.md) to help with the code.

## Disclaimer

This tool is provided "as is" and represents the opinions and research of the community contributors. Always do your own research before purchasing a game.
