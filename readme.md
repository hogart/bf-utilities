# bf-utilities

BlackFlag Roleplaying system utilities for Foundry. Written in typed JS.

## Installation

Copy and paste this url into the *Manifest URL* input in *Install Module* window in your Foundry instance:

`https://github.com/hogart/bf-utilities/releases/latest/download/module.json`

## Features

* Currency management: distribute to party, transfer between characters.
* XP management: award experience points based on defeated creatures, or just any amount.
* Party sheet: a wealth of information at a glance.
* Show the XP dialog when the battle ends.
* API: all features are accessible to other scripts and macros at `game.modules?.get('bf-utilities')?.api`.
* Settings: all features can be turned on/off.

## Development

### Release

* Change `version` field in the module.json. Try to observe semver.
* `git commit`, `git tag vX.Y.Z`, `git push && git push --tags`.
