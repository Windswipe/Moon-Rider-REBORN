# Moon Rider: REBORN

A fork of Supermedium's Moon Rider meant to fix long-standing issues, add QoL tweaks, and new features.

## Changes
### Fixed:
- Updated backend no longer requires many old, long-deprecated dependencies or legacy OpenSSL.
- Bumped core modules like Webpack and Node.
- Album art now properly renders again.
- Quest haptic issues should be resolved. (Huge thanks to @vincentfretin for this fix!)
- Error messages during loading now appear properly.

### New Features:
- **Local Leaderboard Option**: Toggle between cloud and local leaderboards. Local scores are stored in browser localStorage and persist across sessions.

### TODOs (in no particular order):
- Improve hand tracking support.
- Add support for local map loading.
- Improve\replace keyboard in search.
- Improve map lighting support.
- Overhaul search with filter support and the option to hide maps.

## Usage
1. Clone repo.
2. Install dependancies with ``npm i`` 
3. Use ``npm run start`` to start the webserver.
4. Go to http://localhost:3000 in either Chrome or Edge on the host machine.
### OR
Access [Moon Rider: REBORN](https://windswipe.github.io/Moon-Rider-REBORN/) on GitHub Pages from a supported web browser.

## Contribution
If you'd like to contribute, open a PR; I'll review any submitted. AI code is allowed, but it must actually work and have some degree of quality.

If you can't contribute, but have ideas or just want to chat, join the Discord at https://discord.gg/B3sBGabHy9.

## Disclaimer
This project contains AI generated code. I'm not trying to portray this as my own work, and I'm not asking for money. I simply wanted to see these issues fixed and features added, and instead of begging others, I guided GitHub Copilot in VS Code to make the changes I wanted.