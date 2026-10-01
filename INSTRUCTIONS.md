# WePush Fullstack Platform Engineer Task

## Overview

Build a small, production-minded slice of a two-sided creator marketplace.

The system should support the complete marketplace loop:

**Advertiser → Campaign → Creator Matching → Bidding → Campaign Closing → Winners**

The goal is not just to make something that runs locally. Treat the system as something that could realistically be deployed and operated in production.

## 1. Marketplace

### Advertisers

Advertisers can:

* Create campaigns
* Define a campaign budget
* Set a bidding deadline
* Specify creator requirements
* Define commercial goals, such as a target CPM
* Review creator bids and campaign outcomes

You decide which campaign parameters are necessary and how they influence matching and pricing.

### Creators

Creators have social profiles on TikTok or Instagram, including information such as:

* Platform
* Genre/category
* Followers
* Engagement
* Other relevant profile information

Creators should:

* See campaigns that match their profile
* See enough campaign context to decide whether to bid
* See how campaigns are ranked
* Place bids
* Track their bids and outcomes

### Matching & Pricing

Design the marketplace's matching and pricing system.

Your system should answer:

1. Which creators should see a campaign?
2. How should matching campaigns be ranked?
3. How should an appropriate creator price be determined?
4. How should a creator's bid be evaluated against the advertiser's goals?

The rules should be:

* Sensible
* Explainable
* Consistent
* Honest about their limitations

There is no prescribed algorithm. The design decisions are part of the exercise.

## 2. Campaign Closing

Implement a scheduled worker that automatically closes campaigns after their bidding deadline.

When a campaign closes, the worker should:

1. Identify eligible bids
2. Evaluate the bids against the campaign's requirements and pricing model
3. Select winners
4. Ensure the selected creators remain within the campaign budget
5. Persist the final outcome

The closing process must be safe to run in a production environment, including handling repeated or overlapping executions appropriately.

## 3. User Experience

No authentication is required.

The user should be able to choose whether they are acting as an advertiser or creator.

The complete marketplace flow must be usable through the UI without directly modifying the database.

At minimum, demonstrate:

**Advertiser**

`Create Campaign → Review Campaign → Review Bids → Campaign Closes → View Winners`

**Creator**

`View Matched Campaigns → Review Campaign → Place Bid → Track Bid → View Outcome`

## 4. What to Submit

A Git repository containing:

* Web frontend
* Application server
* Scheduled worker
* Database / persistence layer
* Any required infrastructure or configuration

Also include a `README.md` covering:

### Running locally

* Prerequisites
* Installation
* Environment variables
* Database setup
* Starting the frontend
* Starting the application server
* Starting the worker
* Running tests

### Marketplace design

Explain:

* Your matching algorithm
* Your ranking system
* Your pricing model
* How bids are evaluated
* How campaign winners are selected
* Why you made these choices
* Known limitations and trade-offs

### Production

Explain how you would run the system in production, including relevant considerations such as:

* Deployment
* Database
* Scheduled jobs
* Configuration/secrets
* Observability
* Error handling
* Scaling
* Reliability

You do not need to implement every production concern. Explain what you would add and why.

## 5. Scope & Infrastructure

The amount of infrastructure is up to you.

Prioritize the parts that demonstrate good engineering judgment rather than adding infrastructure for its own sake.

The important thing is that the complete marketplace loop works reliably.

## 6. Evaluation

### Architecture & Code Quality

We will look at:

* Service boundaries
* Data model
* Separation of concerns
* Where business logic lives
* Correctness of the campaign-closing job
* Error handling
* Infrastructure choices
* Overall maintainability

### Product Sense

We will look at:

* Whether the product helps both sides make informed decisions
* Whether the UI provides the right context
* What you chose to build
* What you deliberately chose not to build
* Whether the scope is appropriate

### Marketplace Design

We will look at:

* Whether matching rules are sensible
* Whether pricing rules are sensible
* Whether the system is explainable
* Whether advertiser and creator incentives are considered
* Whether limitations and edge cases are acknowledged

## 7. AI Tools

AI coding tools are expected and encouraged.

The evaluation is focused on the engineering decisions behind what you ship, not on whether AI was used to write the code.
