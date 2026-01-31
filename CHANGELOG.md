# Changelog

All notable changes to this project will be documented in this file.

## [1.6.3] - 2026-01-31
### Changed
- Refined badge styling: Darker background colors for better contrast, larger icons, and added text shadow for better icon visibility.

## [1.6.2] - 2026-01-31
### Fixed
- Fixed issue where badges were hidden by Steam's layout truncation (CSS overflow fix).
- Corrected badge matching for "Midnight Games".

## [1.6.1] - 2026-01-31
### Fixed
- Added "Midnight Games" alias to `database.json` to fix matching on certain store pages.
- Bumped `CACHE_KEY` to `v3` to force database refresh for all users.
- Removed obsolete `RENAME_ON_GITHUB.md`.

## [1.6.0] - 2026-01-31
### Added
- Userscript Settings Menu (Language override, Category toggles).
- Export/Import functionality for settings.
- Initial project infrastructure (ESLint, Prettier, Jest, JSON Schema).
- Community documentation (CoC, Security).

## [1.5.0] - 2026-01-31
### Added
- Translations for Italian (it), Portuguese (pt), Polish (pl), Turkish (tr), Japanese (ja), Korean (ko).
- Removal Request workflow automation.

## [1.4.0] - 2026-01-30
### Added
- Multi-language support (de, en, fr, es, ru, zh).
- Auto-generated `PROOFS.md` via GitHub Actions.
- Proof links in userscript now point to `PROOFS.md` anchors.

## [1.3.0] - 2026-01-30
### Fixed
- Cache busting implementation to resolve missing warnings for updated database entries.

## [1.2.0]
### Added
- Initial community database integration.
