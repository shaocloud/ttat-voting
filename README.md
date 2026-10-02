# `create-preact`

<h2 align="center">
  <img height="256" width="256" src="./src/assets/preact.svg">
</h2>

<h3 align="center">Get started using Preact and Vite!</h3>

## Getting Started

-   `pnpm dev` - Starts a dev server at http://localhost:5173/

-   `pnpm build` - Builds for production, emitting to `dist/`

-   `pnpm preview` - Starts a server at http://localhost:4173/ to test production build locally

-   `pnpm test` - Runs the unit tests (tally logic; no database access)

-   `pnpm fake-votes [--rate 2] [--count N]` - Sends random votes to the current session for rehearsal (writes to **production**)

## Voting

### Pages
| Path | What |
|---|---|
| `/` | Audience phones. Shows the vote grid only while the stage is `VOTING`. `?state=voted` stops a second vote. |
| `/display` | Projector. Shows the stage, the live vote count, and the revealed cards. |
| `/adminPage` | Admin controls. Rename it with `ADMIN_PATH` in `src/config.ts`. There is no sign-in, so the path is the only thing hiding it. |

### Database schema (Realtime Database)
```
/voteStage                              "PREVOTE" | "VOTING" | "RESULTS"
/currentSessionId                       string | null
/sessions/{sessionId}/meta              { startedAt, endedAt? }      (server timestamps)
/sessions/{sessionId}/votes/{pushId}    { characterId, ts }          (create-only)
/sessions/{sessionId}/results           { order, counts, tiedForFirst?, frozenAt }
/sessions/{sessionId}/revealIndex       number of cards revealed (0..order.length)
```
`characterId` is the `id` column of `public/assets/chars.csv`, stored as a string (`"0"`–`"13"`).
Types are in `src/types/voting.ts`.

### Service functions (`src/services/voteService.ts`)
| Function | Behaviour |
|---|---|
| `startVoting()` | New session. One `update()` sets `voteStage = VOTING`, `currentSessionId` and `meta`. Refused while already voting. |
| `castVote(characterId)` | Pushes a vote to the current session. Throws `VotingClosedError` outside `VOTING`. |
| `endVotingAndFreeze()` | Writes `meta/endedAt` (the rules then refuse new votes), tallies once, then one `update()` writes `results`, `revealIndex = 0`, `voteStage = RESULTS`. |
| `revealNext()` / `revealPrevious()` | Transaction on `revealIndex`, kept between 0 and `order.length`. |
| `resolveTie(characterId)` | On a tie for first, makes that character the winner (last in `order`). Refused once the winner is revealed. |
| `resetToPrevote()` | `voteStage = PREVOTE`, `currentSessionId = null`. Old sessions stay. |
| `addFakeVotes(n)` | Rehearsal: `n` random votes in one update. |

Tally rules (`src/utils/tally.ts`): every character appears in `order`, lowest count first, so zero-vote characters come first. Equal counts are ordered by numeric id, so the order never reshuffles. If the top count is shared, `tiedForFirst` lists those characters and one of them is picked at random to go last, until the admin overrides it with `resolveTie`.

### Hooks (`src/hooks/`)
`useVoteStage`, `useCurrentSession`, `useVoteStream(sessionId)` (`{ totalCount, newVotes, drain }`; votes that existed before mount are counted but not queued, so a refresh never replays them), `useResults(sessionId)` (`{ results, revealIndex }`), `useCharacters`.

### Rules
`database.rules.json` has a comment on every rule. Deploy after review with:
```
npx firebase-tools deploy --only database
```
The app needs these rules in place: the old rules only allowed the `votes/{id}` counters.

### Rehearsal
1. Open `/adminPage` and `/display` (and `/` on a phone).
2. Start Voting, then run `pnpm fake-votes --rate 3` or press Add 10 Fake Votes.
3. End Voting, then Next Card until the winner, then Reset.

## Credits
'Worn Paper' - Photo by Heather Green: https://www.pexels.com/photo/white-paint-on-wall-18393282/