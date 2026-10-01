# Platform reach and engagement benchmarks (TikTok, Instagram)

Research for the Estimated Impressions formula:

```
round(followers × reachRate[platform] × clamp(ER / baselineER[platform], 0.5, 2.0))
```

ER = engagement rate **by followers** (0–1). Researched 2026-10-01.

## Source quality, in short

- **First-party:** neither Meta nor TikTok publishes typical reach or ER numbers. Their docs only tell us how distribution works (see Caveats).
- **Large-sample, stated methodology (brand accounts):** Socialinsider (35M IG posts / 2M TikTok videos) and Rival IQ (2,100 companies). This is the most trustworthy quantitative data, but it covers **brand** pages, not creators.
- **Creator data:** HypeAuditor (76M IG / 104M TikTok accounts, but definitions are often missing or based on views), Dash Social (no sample size disclosed), and The Influencer Marketing Factory (couldn't fetch, 403; cited second-hand).
- **CPM and pricing:** no high-trust source. It is all vendor and agency blog data with no methodology.

## 1. reachRate (share of followers who view a single post)

**Instagram, brand pages** (Socialinsider):

| Followers | Reach rate (unique reach ÷ followers)¹ | Reels avg views² | Implied Reels views ÷ followers³ |
|---|---|---|---|
| 1–5K | 6.65% | 580 | ~26% |
| 5–10K | 5.75% | 1,000 | ~14% |
| 10–50K | 5.50% | 2,460 | ~11% |
| 50–100K | 4.50% | 6,095 | ~9% |
| 100K–1M | 3.50% | 16,035 | ~5% |
| All | 3.2% (Aug 2026, −14% YoY). By format: carousel 4.5%, Reels 4.1%, image 4.0% | | |

¹ [Socialinsider, "Social Media Reach Statistics 2026", 2026-09-03](https://www.socialinsider.io/blog/social-media-reach/). 872K FB+IG brand posts, Jan 2025–Aug 2026.
² [Socialinsider, "2026 Instagram Benchmarks", 2026-02-20](https://www.socialinsider.io/blog/instagram-benchmarks/). 35M posts from 447K pages, 2025 data.
³ My own calculation: average views ÷ the geometric midpoint of each bracket (≈2.2K, 7.1K, 22K, 71K, 316K). Treat these as approximate.

**TikTok, brand pages** ([Socialinsider, "2026 TikTok Benchmarks", 2026-04-22](https://www.socialinsider.io/blog/tiktok-benchmarks/). 2M videos from 214K profiles, 2024–2025):

| Followers | Avg views/video 2025 | Implied views ÷ followers³ |
|---|---|---|
| 1–5K | 350 (860 in 2024) | ~16% |
| 5–10K | 945 | ~13% |
| 10–50K | 3,240 | ~15% |
| 50–100K | 9,900 | ~14% |
| 100K–1M | 34,900 | ~11% |

Overall views fell 23% YoY, and posting frequency rose 40% (same source).

- **"TikTok views exceed followers for small accounts"** is true for individual viral posts. It is **not** supported as a median by any high-trust dataset I found. Secondary blogs claim 120–250% of followers for accounts under 100K (e.g. [Heist, "Average TikTok Views 2026"](https://heistbrain.com/benchmarks/tiktok-views.html)), but they give no methodology. The mechanism is first-party: TikTok says "neither follower count nor whether the account has had previous high-performing videos are direct factors" in recommendations ([TikTok Newsroom, 2020-06-18](https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you)). So views per post are high-variance and only loosely tied to followers.
- **Tier effect:** strong on Instagram (~26% falling to ~5% across the brackets). Weak on TikTok (~16% falling to ~11%).

## 2. baselineER (engagement by followers)

| Source | Population | Instagram | TikTok | Definition |
|---|---|---|---|---|
| [Rival IQ 2025 Benchmark Report, 2025-02-25](https://get.rivaliq.com/hubfs/eBooks/2025-Social-Media-Industry-Benchmark-Report.pdf) | 2,100 brands, median | **0.36%** (−16% YoY) | **1.73%** (−34% YoY) | all interactions ÷ followers |
| [Socialinsider Benchmarks 2026, 2026-01-16](https://www.socialinsider.io/social-media-benchmarks) | 70M brand posts, 2025 | 0.48% | 2.60% | IG: likes+comments ÷ followers. TT: likes+comments+shares+saves ÷ followers |
| [Dash Social, "Influencer Benchmarks", 2026-03-27](https://www.dashsocial.com/blog/influencer-benchmarks) | creators, n not stated | nano 3.8%, micro 2.4%, macro (100K–1M) 1.6%, mega 1.7% | — | engagements ÷ followers |
| [HypeAuditor State of IM 2025](https://hypeauditor.com/state-of-influencer-marketing-2025/) / [trends post, 2025-05-01](https://blog.hypeauditor.com/2025-influencer-marketing-trends-insights-from-hypeauditor-s-latest-report/) | 76M IG / 104M TT accounts | overall 1.59% (2024), nano 2.19% | nano 10.3–11.9% | TT ER is **by views** ([HypeAuditor, 2025-04-13](https://blog.hypeauditor.com/what-is-tiktok-engagement-rate-why-brands-should-take-note/)). IG unstated |
| Influencer Marketing Factory, via [iqfluence](https://iqfluence.io/public/blog/influencer-marketing-engagement-rate) (secondary) | creators | — | <100K 7.5%, 100–500K 5.1%, 500K–1M 4.48%, 1–5M 3.76% | (likes+comments+shares+saves) ÷ followers |
| Socialinsider TikTok (above) | brands | — | 3.75–4.40% by views, roughly flat across tiers | **by views** |

Ranges by followers: **Instagram 0.36% (brands) to ~2–4% (creators)**. **TikTok 1.7–2.6% (brands) to ~4–7.5% (creators)**. Numbers based on views (HypeAuditor's ~10% for TikTok) are **not comparable** with our ER and must not be used as the baseline.

## 3. CPM and cost per post (low trust; sanity check only)

- **CPM:** Instagram $5–15 and TikTok $3–10 ([Page One Formula, 2024–25](https://pageoneformula.com/influencer-marketing-cost-cpm-benchmarks-2024-2025/), no primary data). Wider ranges, Instagram Reels $8–60 and TikTok $5–50 depending on tier ([Bizkol, 2026-07-03](https://www.bizkol.ai/blog/influencer-cpm-benchmarks), no methodology). Medians cited are $8–12 for Instagram and ~$10 for TikTok ([Stack Influence, updated 2026-03-06](https://stackinfluence.com/roi-benchmarks-2025-tiktok-instagram-amazon/)), plus an "average influencer CPM $4.63 (2024)" figure that I couldn't trace to its source.
- **Cost per post** ([Influencer Marketing Hub, "Influencer Rates", updated 2026-09-30](https://influencermarketinghub.com/influencer-rates/)):
  - Instagram: nano $100–1K, micro $200–3K, mid $1K–5K+, macro $5K+, mega $10K+.
  - TikTok: nano $300–2K, micro $1K–5K, mid $5K–20K.
  - IMH's own TikTok sub-page says nano $50–200 and micro $200–800, so the sources contradict each other by about 5x.
- **Implication:** organic reach makes quoted fees look expensive. Take a 25K-follower Instagram micro creator: 25K × 10% = 2.5K impressions, and at a $10 CPM that is worth $25, while quoted fees are $200–3K. Fees also pay for content production and usage rights, so a fee based on CPM alone will undershoot market rates for small creators.

## 4. Caveats

- **Definitions disagree.** ER can be by followers, by reach, or by views. Which interactions count also differs: IG likes+comments only in Socialinsider, all interactions in Rival IQ.
- **Instagram changed its metric.** Instagram replaced Impressions and Plays with **Views**, which counts repeat views, on 2025-04-21 ([Social Media Today](https://www.socialmediatoday.com/news/instagram-updates-metrics-to-focus-creators-on-views/723645/)). Data from before and after the change isn't directly comparable.
- **Brand data is not creator data.** The best-sampled sources are brand pages. Creators typically engage more (HypeAuditor says up to 4x brands).
- **Self-reported numbers.** Creator ER relies on public counts, which are inflated by fake followers and engagement pods. Pricing numbers are surveys or anecdotes.
- **Survivorship bias.** Datasets cover active and tracked accounts only.
- **Platforms drift fast.** Instagram reach fell 12–14% YoY and TikTok views fell 23% YoY. Most Reels a viewer sees come from accounts they don't follow ([Instagram, "Ranking Explained", 2023-05-31](https://about.instagram.com/blog/announcements/instagram-ranking-explained)), so the link between followers and views keeps weakening.

## Recommended constants

| Constant | Instagram | TikTok |
|---|---|---|
| **reachRate** | **0.10** | **0.15** |
| Justification | ≈ the median of Reels views ÷ followers across the 5K–100K brackets (9–14%). Sits above unique feed reach (3–7%) because we estimate impressions, not unique reach | Brand views ÷ followers is flat at 11–16% across all tiers (Socialinsider, 2M videos) |
| Limitation | Brand data. Real values range ~5% (100K+) to ~26% (<5K) | Brand data. Creator and viral posts can exceed 100% of followers. Very high variance |
| **baselineER** | **0.02** (2%) | **0.05** (5%) |
| Justification | Midpoint of creator ER by followers (Dash Social 1.6–3.8%, HypeAuditor 1.59–2.19%) | Between brand (1.7–2.6%) and creator (IMF 3.8–7.5%) ER by followers |
| Limitation | Way above the brand median (0.36–0.48%), so brand-like accounts hit the 0.5 floor | No high-trust creator source by followers. HypeAuditor's ~10% is based on views |
| **CPM sanity range** | **$5–20** (default ~$10) | **$3–15** (default ~$8) |
| Justification | Clusters of $5–15 and medians of $8–12 across sources | Clusters of $3–10 and medians of ~$5–10 |
| Limitation | No methodology anywhere. Nano and mega creators run $20–60+ | Same. Tier-dependent ($5 to $50) |

**Flat or tier-dependent reachRate?** Stay flat. The ER clamp already lowers estimates for large creators, because ER falls with follower count. The clamp's 0.5–2.0 band also absorbs most of the remaining spread. TikTok's tier spread (11–16%) is too small to justify tiers. Instagram's spread (~5x) is real, so if one refinement is ever worth adding, it is a 3-step Instagram table (<10K 0.20, 10–100K 0.10, 100K+ 0.05). The added explainability cost probably isn't worth it for a take-home.
