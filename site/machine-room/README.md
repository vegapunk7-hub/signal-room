# Machine Room

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

**A model becomes a computer.** Type terminal commands and a Pollinations model responds as a fictional operating system, updating a virtual filesystem, process list and machine metrics.

Built for [Pollinations Quest #19179](https://github.com/pollinations/pollinations/issues/19179).

## Live app

https://vegapunk7-hub.github.io/signal-room/machine-room/

## How it works

- Choose a Pollinations text model and a machine personality.
- Boot the free offline demo, or connect your own Pollinations account for live commands.
- Explore familiar commands such as `help`, `ls`, `pwd`, `whoami`, `status`, `ps`, `free` and `cat README.md`.
- Try creative prompts such as `invent a new file system` in live mode.
- Inspect the virtual file tree, event log, CPU and memory meters.
- Interrupt an in-progress live request at any time.

## Demo and live mode

The offline demo is entirely local: no Pollinations API requests and no Pollen are used.

For live mode, sign in with Pollinations and approve a scoped text-model budget on the consent screen. Each live terminal command makes one chat-completions request.

## Safety boundary

Machine Room is a simulation, not a shell. It does not execute operating-system commands, run code, access real files, inspect devices, or control the visitor's computer. Model responses are treated as simulated terminal text and virtual state only.

## Credit and license

The Pollinations credit badge is visible on the app page and this README. MIT licensed.
