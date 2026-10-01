# Design System Components

The project is currently quite complex and has "information-overload" on the UI. The overarching goal is to **simplify it, reduce unnecessary verboseness, and make it more intuitive**.

The following are just ideas to get the ball rolling. Ignore if you feel like there's a more usable solution given what we have.

## Design System

Feel free to adapt or expand the design system to accomodate changes.

## Components & Libraries

I'd _optionally_ suggest a mini "UI Kit" or "Component Library" that provides a set of reusable components for the project. Installing [Reka UI](https://reka-ui.com) would be a good starting point if you need out-the-box solutions for unstyled components.

I'd also suggest installing [Iconify](https://iconify.design/) for icon support. It can help simplify verbosity.

## The Look and Feel

### Navbar & Homepage

The application should have an always-visible navigation menu with the company logo (placed under `apps/web/public/logo.webp` currently) to go home, and the ability to navigate between the advertiser and creator "hubs". By default, the advertiser hub should likely be displayed, as it's the "main entry point" for the task.

A theme-switcher should also be on the end of the navbar (with switching icons depending on the current theme).

### New Advertiser/Creator

Creating a new advertiser or creator should likely be done via a dialog. Form controls and dialogs can easily be added through Reka UI bases.

### Opening

Upon creating a new advertiser or creator, or clicking on an existing one,the user should be taken to the appropriate one.

If clicking on a "hub", there should be a "default" page to display, likely listing all the advertisers or creators in that hub.

### Appropriate View

When opening the view for an advertiser or creator, we need to greatly simplify the information shown. It's too much data/text to quickly parse/scan.

- Add a badge or tag component to simplify what we're seeing at a glance in terms of categories.
- Add icons to simplify verbosity.
- Color coding can help.
- Perhaps some sections can be in collapsible sections/cards.
