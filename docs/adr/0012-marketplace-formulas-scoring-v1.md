# Marketplace formulas: CPM-anchored pricing, absolute Relevance, greedy Scoring v1

Every marketplace number derives from one heuristic, **Estimated Impressions**, and is anchored on the Advertiser's **Target CPM**. All of it lives as pure functions in `@wepush/domain` (ADR 0005). Bid placement and Closing call the same functions, so the Bid Snapshot written at placement can't drift from what Closing judges (ADR 0004). Closing is stamped `SCORING_VERSION = 'v1'`. Decided in #25, #20, #19 and #21; constants sourced in `docs/research/platform-reach-engagement-benchmarks.md`.

## Formulas

| | Instagram | TikTok |
|---|---|---|
| Reach Rate | 0.10 | 0.15 |
| Baseline Engagement Rate | 0.02 | 0.05 |
| CPM range | $5–20 | $3–15 |

```
estimatedImpressions = max(1, round(followers × reachRate × clamp(ER / baselineER, 0.5, 2)))
effectiveCpmCents    = round(feeCents × 1000 / estimatedImpressions)

parityFee   = round(estimatedImpressions × targetCpm / 1000)
Fee Range   = [$10, min(Budget, max($10, round(3 × parityFee)))]
suggestedFee = parityFee kept within the Fee Range

payout     = clamp((targetCpm − cpmLow) / (cpmHigh − cpmLow), 0, 1)
budgetFit  = Budget / parityFee;  fit = budgetFit < 1 ? 0 : min(budgetFit, 5) / 5
relevance  = round(100 × (0.6·payout + 0.4·fit))            // ties: earlier deadline, then id

cpmFit     = clamp(targetCpm / effectiveCpm, 0, 2) / 2
engagement = clamp(ER / baselineER, 0, 2) / 2
score      = round(100 × (0.75·cpmFit + 0.25·engagement), 2)
```

- **Matching** is strict and inclusive against the Creator's current profile. **Placement** checks, in order: `campaign_closed`, `deadline_passed`, `already_bid`, `requirements_not_met`, `fee_out_of_range`, and returns the Bid Snapshot on success.
- **Closing** re-checks eligibility on the snapshot: follower and engagement minimums, then the Fee Range recomputed from the snapshot's Estimated Impressions. Inputs are immutable, so the result always agrees with placement. Rank is Eligible first, then Score desc, Fee asc, `placedAt`, id. Winners are chosen greedily in Rank order: a Bid Wins if its Fee fits the Remaining Budget, otherwise it is Lost `over_budget` and the walk continues. There's no Winner cap.
- **Loss Reasons**, in precedence order: `requirements_not_met`, `fee_out_of_range`, `over_budget`. `bids.remaining_budget_cents` records the Budget left when each Eligible Bid's turn came (null for ineligible Bids), so `over_budget` can be explained with numbers.
- Explanations are `Factor[]` (`payout`/`budget_fit` for Relevance, `cpm_fit`/`engagement` for Score) with `contribution = 100 × weight × value`. Relevance is computed on read; Score factors are persisted.

## Considered options

- **Knapsack winner selection** would spend Budget better but is opaque: the top-Ranked Bid could lose for a reason its Creator can't act on. Greedy skip-and-continue keeps "you were #k and the Remaining Budget was $X" explainable.
- **A separate CPM ceiling at Closing** was dropped for the placement Fee Range, so there's one rule and one constant (`MAX_TARGET_CPM_MULTIPLE = 3`).
- **Relative normalisation** of Relevance (against the Creator's other Campaigns) was rejected so a Campaign's Relevance doesn't move when others open or close.
- **A production allowance on the Suggested Fee** and **Category factors** were left out because their constants would be indefensible.

## Limitations

- Estimated Impressions is a heuristic from brand-page benchmarks on self-reported inputs, not a forecast. There's no Category or content-quality signal, and the engagement clamp only limits inflation.
- Fees priced at CPM parity cover views only. Small creators look expensive and are capped below market per-post rates when Target CPM is low; the $10 floor keeps them biddable but they score low.
- The weights (0.6/0.4, 0.75/0.25), the fit cap of 5, the 3× multiple and the $10 floor are judgement calls, not fitted values. In production they'd be tuned on delivered-view, bid and win data, under a new Scoring Version.
- Engagement counts twice: in Estimated Impressions and in Score.
- Greedy can leave Budget unspent, or pick one large Bid where two smaller ones would add more.
- Within one Creator's list, payout ranking is effectively Target CPM ranking, and bigger Creators score lower on fit.
