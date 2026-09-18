# Yoco webhook setup

Yoco sends a `payment.succeeded` event to isibaya when a customer pays. This is
what actually activates a subscription.

The browser also confirms the payment when it returns from Yoco's hosted page
(`yoco-verify-checkout`), and that is the faster of the two — but it only runs if
the customer waits for the redirect. Close the tab, lose signal on a farm road,
or take a phone call and it never fires. The webhook arrives regardless, and Yoco
retries it, so R1,800 never goes missing.

Endpoint: `https://isibaya.smartpick.co.za/.netlify/functions/yoco-webhook`

## One-time registration

Webhooks are registered through the API, not the Yoco portal. Run this once with
your **live** secret key:

```bash
curl -X POST https://payments.yoco.com/api/webhooks \
  -H "Authorization: Bearer $YOCO_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"isibaya","url":"https://isibaya.smartpick.co.za/.netlify/functions/yoco-webhook"}'
```

The response looks like this:

```json
{
  "id": "sub_…",
  "mode": "live",
  "name": "isibaya",
  "url": "https://isibaya.smartpick.co.za/.netlify/functions/yoco-webhook",
  "secret": "whsec_…"
}
```

**Copy `secret` straight into Netlify → Site settings → Environment variables as
`YOCO_WEBHOOK_SECRET`, then redeploy.** Yoco returns it only on this response and
there is no way to read it back — losing it means deleting the webhook and
registering a new one. Don't paste it into chat, a commit, or a ticket.

Until that variable is set the endpoint replies `503` and rejects every delivery,
so register the webhook and set the secret in the same sitting.

To see what is currently registered:

```bash
curl https://payments.yoco.com/api/webhooks -H "Authorization: Bearer $YOCO_SECRET_KEY"
```

## How a delivery is verified

Yoco follows the Standard Webhooks scheme. Each request carries `webhook-id`,
`webhook-timestamp` and `webhook-signature`, and the signature is an HMAC-SHA256
over `{webhook-id}.{webhook-timestamp}.{raw body}`, keyed with the base64-decoded
part of the `whsec_` secret.

`netlify/lib/billing.js` verifies that before reading a single field out of the
body, and rejects with `401` if it fails. Three things matter in the
implementation:

- The **raw** request body is hashed. Parsing the JSON and re-serialising it
  reorders keys and produces a completely different signature.
- Deliveries older than **3 minutes** are refused, per Yoco's recommendation, so
  a captured request can't be replayed later.
- Signatures are compared with `timingSafeEqual`.

The endpoint is deliberately unauthenticated — Yoco has no isibaya session. The
signature is the only thing standing between a stranger and a free subscription,
which is why it fails closed when the secret is missing.

## Paying exactly once

Both the webhook and the browser's return call `markPaidAndExtend()`, which flips
the payment `PENDING → PAID` with a conditional update and only adds the month if
that update actually claimed the row. Whichever arrives first does the work; the
other sees it already settled and changes nothing. Yoco's retries land in the same
place. A single payment can never buy two months.

## Checking it works

Netlify → Functions → `yoco-webhook` shows one line per delivery:

- `payment … activated` — the month was added by this delivery.
- `payment … was already settled` — the browser (or a retry) got there first.
  Normal and expected.
- `rejected an unverified delivery` — signature failed. Usually the wrong
  `YOCO_WEBHOOK_SECRET`, or a live webhook pointed at a test deploy.
- `no matching payment for event …` — the event couldn't be tied to an account.
  The line logs the payload and metadata **keys** so the shape can be compared
  against what `yoco-create-checkout` sends; values are left out because they
  identify the customer.

The payment is matched by the Yoco checkout id where the event carries one, and
otherwise by the `userId` we attach as checkout metadata, taking that account's
oldest outstanding checkout. Metadata keys are matched case-insensitively —
`userId` has been seen coming back as `userid`.
