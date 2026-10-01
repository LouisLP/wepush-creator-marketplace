# Identity without auth: trusted per-role headers resolved to `req.actor`

There's no authentication (the brief doesn't require it). Web sends `X-Advertiser-Id` on `/api/advertiser/*` and `X-Creator-Id` on `/api/creator/*`, and the api trusts them. In each role's Fastify scope, an `onRequest` hook validates the header (uuid), looks up the row, and sets a typed `req.actor`. A missing or malformed header gets `401 actor_required`; an unknown id gets `401 unknown_actor`. Another actor's resource gets `404`, via query scoping, so there's no 403 and no existence leak. Public routes `GET|POST /api/advertisers` and `GET|POST /api/creators` back the role picker.

On web, the role comes from the URL prefix. One identity per role is kept in localStorage, a router guard sends you to the picker when the slot is empty, and `call()` injects the header based on the endpoint's path. On a 401 actor code, web clears that slot.

For production, the hook gets replaced by bearer-token or session resolution that produces the same `req.actor`, and routes and services don't change. We rejected a generic `X-Actor-Id` (no guard against using the wrong role) and a cookie session (it adds a session endpoint and CSRF handling and gains nothing here).
