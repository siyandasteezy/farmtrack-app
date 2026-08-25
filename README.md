# insimi

Livestock management for modern farms — a React + Vite SPA. Live at
**https://insimi.smartpick.co.za**.

Tech: React 19, Vite, Tailwind CSS v4, React Router v7, Recharts, Leaflet.
Payments run through **Yoco Checkout** via Netlify Functions.

## Develop

```bash
npm install
npm run dev          # Vite dev server (no payment functions)
```

To exercise the Yoco payment functions locally you need the Netlify CLI:

```bash
npm i -g netlify-cli
# put YOCO_SECRET_KEY (sk_test_…) in a local .env  (gitignored)
netlify dev          # serves the app + functions on http://localhost:8888
```

Yoco test card: `4111 1111 1111 1111`, any future expiry, any CVV.

## Deploy — Netlify + Afrihost subdomain

insimi is hosted on **Netlify**; `insimi.smartpick.co.za` is a subdomain of the
Afrihost-managed `smartpick.co.za` domain, pointed at the Netlify site (same
pattern as khulagrow).

### 1. Netlify

1. **Add new site → Import an existing project** → pick this repo.
   `netlify.toml` already configures the build (`npm run build` → `dist/`) and
   the functions directory (`netlify/functions`).
2. **Site settings → Environment variables:**
   - `YOCO_SECRET_KEY` — your Yoco secret key (`sk_test_…` to trial, `sk_live_…`
     for production). See **Yoco** below.
   - `APP_URL` — `https://insimi.smartpick.co.za` (optional; redirects fall back
     to the request origin).
3. Deploy.

### 2. Custom domain (Netlify + Afrihost DNS)

1. Netlify → **Domain management → Add a domain** → `insimi.smartpick.co.za`.
   Netlify shows the DNS target (e.g. `apex-loadbalancer.netlify.com` or your
   site's `*.netlify.app` host).
2. In **Afrihost** (the DNS host for `smartpick.co.za`) → your DNS zone → add a
   record for the `insimi` subdomain:
   - **CNAME** `insimi` → the `*.netlify.app` host Netlify gave you.
3. Back in Netlify, wait for DNS to verify, then let it provision the free
   **Let's Encrypt HTTPS** certificate. Force HTTPS on.

### 3. Yoco

1. Get your secret key: Yoco Business Portal → **Manage → Connect → Checkout API
   → "How to connect"** (direct:
   `https://app.yoco.com/manage/yoco-connect/integration?name=checkout_api`).
2. Put it in Netlify as `YOCO_SECRET_KEY`.
3. For live payments (`sk_live_…`), add **`insimi.smartpick.co.za`** under Yoco's
   **Verified Domains** — live keys stay locked until a domain is verified.

> **Note:** insimi has no database — after a Yoco-verified payment, access is
> persisted client-side in `localStorage`. Real money is collected, but the
> "subscribed" flag lives in the browser (consistent with the app's current
> auth). A durable, tamper-proof subscription needs a backend + DB.
