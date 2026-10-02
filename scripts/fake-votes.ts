// Sends fake votes to the current session at a steady rate, for projector rehearsal.
//
//   pnpm fake-votes                     2 votes/sec until voting closes
//   pnpm fake-votes --rate 5 --count 100
//
// This writes to the PRODUCTION database. Votes go through castVote, the same
// path phones use, so it stops by itself once the admin ends voting.

import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { parseCharacters } from '../src/data/characters'
import { castVote, getCurrentSessionId, VotingClosedError } from '../src/services/voteService'

const { values } = parseArgs({
    options: {
        rate: { type: 'string', default: '2' },  // votes per second
        count: { type: 'string' },              // stop after this many (default: until voting closes)
    },
})

const rate = Number(values.rate)
const count = values.count === undefined ? Infinity : Number(values.count)
if (!(rate > 0) || !(count > 0)) {
    console.error('--rate and --count must be positive numbers')
    process.exit(1)
}

const ids = parseCharacters(readFileSync('public/assets/chars.csv', 'utf8')).map((c) => String(c.id))
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const sessionId = await getCurrentSessionId()
console.log(`session ${sessionId ?? '(none)'}: sending ${count === Infinity ? 'votes' : count} at ${rate}/s`)

let sent = 0
try {
    while (sent < count) {
        const started = Date.now()
        await castVote(ids[Math.floor(Math.random() * ids.length)])
        sent++
        if (sent % 10 === 0) console.log(`${sent} sent`)
        await sleep(Math.max(0, 1000 / rate - (Date.now() - started)))
    }
} catch (err) {
    if (!(err instanceof VotingClosedError)) throw err
    console.log('voting is not open')
}

console.log(`done: ${sent} votes`)
// the database client keeps its socket open, so exit explicitly
process.exit(0)
