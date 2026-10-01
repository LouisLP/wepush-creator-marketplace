# Closing worker: Postgres-only poll loop, one transaction per Campaign, SKIP LOCKED

The worker is a long-lived process: it drains the due Campaigns, then sleeps `CLOSE_POLL_INTERVAL_MS` (default 5s). There's no Redis, queue library, external cron or pg_cron. Each Campaign closes in its own transaction: `SELECT … WHERE status = 'open' AND bidding_deadline <= $now ORDER BY bidding_deadline, id LIMIT 1 FOR UPDATE SKIP LOCKED`, then load the pending Bids, run the pure `closeCampaign`, write the Bid outcomes (`WHERE status = 'pending'`), and `markClosed … WHERE status = 'open'`, asserting exactly one row.

There's deliberately **no `closing` status** and no lease. If the worker crashes mid-close, the transaction rolls back and releases the lock, and the next tick picks the Campaign up again. Because the lock and the status change commit together, any number of replicas is safe. A Campaign that fails to close is logged, excluded for the rest of that tick, and retried on later ticks. Bid placement takes `FOR SHARE` on the Campaign row, so it serializes with Closing's `FOR UPDATE`: whichever commits first wins, whatever the clock skew between api and worker. SIGTERM finishes the in-flight Campaign, then exits.

## Considered options

pg-boss/graphile-worker (a second moving part for a single job), and an `open → closing → closed` lease (needs a sweeper for stuck claims, which row locks make unnecessary).
