# WePush Creator Marketplace

A two-sided marketplace where Advertisers run Campaigns and Creators bid to take part in them; a scheduled close picks the winning Bids within budget.

## Language

### Parties

**Advertiser**:
A brand that creates Campaigns and reviews the Bids placed on them.
_Avoid_: Brand, client, buyer

**Creator**:
A person with exactly one self-reported social profile on one Platform, described by Category, follower count and engagement rate. Someone active on two Platforms is two Creators.
_Avoid_: Influencer, profile, account, seller

**Handle**:
The name a Creator goes by on their Platform, e.g. `@mia.cooks`; unique across Creators.
_Avoid_: Username, name, slug

**Platform**:
The social network a Creator publishes on — TikTok or Instagram.
_Avoid_: Network, channel, social

**Category**:
The single content genre a Creator belongs to, drawn from a fixed list (beauty, fashion, fitness, food, gaming, tech, travel, lifestyle, finance, parenting).
_Avoid_: Genre, niche, vertical, tag

### Campaigns

**Campaign**:
An Advertiser's offer to buy one Post each from several Creators, with a Brief, Requirements, Budget, Bidding Deadline and Target CPM.
_Avoid_: Job, gig, brief, offer, deal

**Brief**:
The free-text description of what the Advertiser wants from the Post, shown to Creators.
_Avoid_: Description, instructions

**Requirements**:
The hard filters a Creator must pass to see a Campaign: its Platform, one of its Categories, a minimum follower count and optionally a minimum engagement rate.
_Avoid_: Criteria, targeting, filters

**Budget**:
The most an Advertiser will spend on a Campaign; the sum of winning Fees may not exceed it.
_Avoid_: Spend, cap, total

**Bidding Deadline**:
The moment after which a Campaign accepts no more Bids and becomes due to close.
_Avoid_: End date, expiry, close date

**Open**:
A Campaign's state from creation until it is Closed. Its terms never change once created.
_Avoid_: Active, live, published, draft

**Closing**:
The one-time automatic act, after the Bidding Deadline, that selects a Campaign's Winners and makes it Closed. The Advertiser cannot pick or veto Winners.
_Avoid_: Settlement, finalisation, resolution

**Closed**:
A Campaign's final state once Closing has run, whether or not it has any Winners.
_Avoid_: Ended, finished, expired, completed

**Matched Campaign**:
An Open Campaign, before its Bidding Deadline, whose every Requirement a given Creator's current profile meets. Only Matched Campaigns can be bid on.
_Avoid_: Eligible campaign, recommendation, feed item

**Relevance**:
How well a Matched Campaign suits a given Creator, weighing its Target CPM against the Platform's typical range and its Budget Fit; orders the Creator's Matched Campaigns.
_Avoid_: Rank (reserved for Bids), match score, fit score

**Budget Fit**:
How many Posts at a given Creator's Parity Fee a Campaign's Budget could pay for.
_Avoid_: Slots, headroom, capacity

### Pricing

**Post**:
The single deliverable every Campaign buys from each winning Creator: one piece of content on the Campaign's Platform.
_Avoid_: Deliverable, content piece, placement

**Fee**:
The flat amount a Creator asks, in a Bid, to make one Post.
_Avoid_: Price, rate, quote (except in Fee Quote), amount

**Estimated Impressions**:
The number of views the system expects a Creator's Post to get, derived from the Creator's follower count, Reach Rate, and engagement rate relative to the Baseline Engagement Rate.
_Avoid_: Reach, views, expected views

**Effective CPM**:
A Bid's Fee expressed as cost per thousand Estimated Impressions; how a Bid is compared to the Target CPM.
_Avoid_: Bid CPM, actual CPM

**Reach Rate**:
The share of a Creator's followers expected to view one Post on a given Platform.
_Avoid_: View rate

**Baseline Engagement Rate**:
The reference engagement rate for a Platform that a Creator's engagement rate is measured against.
_Avoid_: Average ER, benchmark ER

**Target CPM**:
The cost per thousand impressions an Advertiser aims to pay on a Campaign.
_Avoid_: Max CPM, goal CPM

**Parity Fee**:
The Fee at which a Bid's Effective CPM would equal the Campaign's Target CPM for a given Creator; covers Estimated Impressions only, not production or rights.
_Avoid_: Fair price, market rate

**Suggested Fee**:
The Parity Fee kept within the Fee Range; offered to a Creator as the starting Fee for their Bid.
_Avoid_: Recommended price, fair price

**Fee Range**:
The lowest and highest Fee a Bid may ask on a Campaign. The lowest is a flat floor, the same on every Platform. The highest is a fixed multiple of the Parity Fee, never below the floor and never above the Budget.
_Avoid_: Price bounds, limits

**Fee Quote**:
What a Creator is shown before bidding on a Campaign: their Estimated Impressions, Suggested Fee and Fee Range.
_Avoid_: Estimate, offer

### Bidding

**Bid**:
A Creator's single, final offer to make one Post for a Campaign at a stated Fee. A Creator places at most one Bid per Campaign and cannot change or withdraw it. Sealed: the Advertiser sees every Bid, other Creators see none.
_Avoid_: Offer, application, proposal, pitch

**Bid Snapshot**:
The Creator's follower count, engagement rate, Estimated Impressions and Effective CPM as they stood when the Bid was placed; Closing judges the Bid on these, not the Creator's current profile.
_Avoid_: Bid stats, frozen profile

**Eligible Bid**:
A Bid whose Bid Snapshot meets the Campaign's Requirements and whose Fee is within the Fee Range; only Eligible Bids compete for the Budget at Closing.
_Avoid_: Valid bid, qualifying bid

**Pending**:
A Bid's state from placement until its Campaign's Closing.
_Avoid_: Submitted, active, open

**Won**:
A Bid selected at Closing; its Creator is a Winner.
_Avoid_: Accepted, awarded, selected

**Lost**:
A Bid not selected at Closing, always with a Loss Reason.
_Avoid_: Rejected, declined, failed

**Loss Reason**:
The explanation given to a Creator for why their Bid was Lost, naming the first of these that applies: its Bid Snapshot did not meet the Requirements, its Fee was outside the Fee Range, or its Fee did not fit the Remaining Budget.
_Avoid_: Rejection reason, status reason

**Remaining Budget**:
The part of a Campaign's Budget not yet taken by better-Ranked Winners at the point an Eligible Bid is considered; that Bid is Won if, and only if, its Fee fits within it.
_Avoid_: Leftover, headroom, balance

**Score**:
The number Closing assigns each Bid to say how well it serves the Campaign's goals: mostly its Effective CPM against the Target CPM, partly its Bid Snapshot's engagement rate against the Baseline Engagement Rate.
_Avoid_: Rating, value, quality

**Rank**:
A Bid's position among its Campaign's Bids at Closing — Eligible Bids before the rest, each by best Score — shown to both sides.
_Avoid_: Position, place, order

**Spent**:
The sum of the Winners' Fees on a Closed Campaign; never more than the Budget.
_Avoid_: Cost, total, used budget

**Scoring Version**:
A label recorded at Closing naming the rules that produced the Scores, so past outcomes stay explainable after the rules change.
_Avoid_: Algorithm version, model version

**Winner**:
A Creator whose Bid was Won on a Campaign.
_Avoid_: Selected creator, awardee
