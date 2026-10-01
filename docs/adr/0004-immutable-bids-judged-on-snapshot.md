# Flat data model: immutable Campaigns and Bids, outcome on the rows, Bids judged on a snapshot

A Campaign goes `open → closed` and its terms never change after creation. A Bid goes `pending → won | lost`, is unique per (Campaign, Creator), and can't be edited or withdrawn. There's no separate "result" table. Closing writes its outcome onto the existing rows: `campaigns.{spent_cents, closed_at, scoring_version}` and `bids.{status, score, rank, loss_reason, score_factors}`, with factors stored as jsonb so a past outcome stays explainable after the rules change.

When a Bid is placed, it stores a **Bid Snapshot** (followers, engagement rate, Estimated Impressions, Effective CPM) next to the Fee and `placed_at`. Closing judges the snapshot, never the Creator's live profile. That keeps Closing deterministic and safe to re-run, and a Creator can't change their profile after bidding to change the result.

DB CHECKs enforce the invariants: `spent_cents <= budget_cents`, `(status = 'closed') = (closed_at is not null)`, `(status = 'lost') = (loss_reason is not null)`, and positive money.
