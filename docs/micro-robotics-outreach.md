# Outreach draft — Micro Robotics (robotics.org.za)

Who they are: Arduino/ESP32 component importer, branches in Centurion and
Stellenbosch. They sell parts, not finished farm sensors — so the ask is a
supply/reference relationship, not a reseller-of-product one.

**To:** (contact form at robotics.org.za, or sales@ — check the site for the
right address before sending)
**From:** siyanda@smartpick.co.za

---

**Subject:** Standardising a farm-sensor parts list on locally stocked hardware

Hi there,

I'm Siyanda Edwana. I build and run isibaya (https://isibaya.smartpick.co.za),
a South African farm-management platform — livestock, beekeeping and crops,
with record-keeping built around SA regulation rather than imported from a US
or EU product.

I'm getting in touch about the sensing side of it.

Farm monitoring is part of what isibaya does: soil moisture, water level and
flow, weather, hive weight and temperature, cold-chain and store conditions,
all feeding a farm's dashboard. I'm building out the device-ingestion side now,
which means I'm about to make a decision I'd rather make with a supplier than
around one — which hardware to support first.

My preference is to standardise on parts that are genuinely stocked in South
Africa, with local support and a realistic lead time. Ordering a sensor from
overseas and waiting three weeks is a non-starter for a farmer, and it's the
fastest way for the feature to go unused. Your Centurion and Stellenbosch
branches cover two regions where a good number of the farms I speak to are
based — the Cape Winelands especially.

Three things I'd like to find out:

1. **Supply.** Can you stock and supply a defined parts list on an ongoing
   basis? I'm thinking along the lines of ESP32 boards, soil moisture and
   temperature probes, rain and weather sensors, load cells for hive scales,
   water flow and level sensors, and the enclosures, regulators and power bits
   that go with them. I can send our draft bill of materials.

2. **Trade terms.** Do you run trade or reseller accounts, and is there volume
   pricing? I'd want to know what a farm is realistically paying before I put
   a number in front of anyone.

3. **A referenced kit.** Would you be open to isibaya publishing an
   "isibaya-compatible" parts list that links straight to your product pages?
   When I talk to a farmer about sensors, I want to point at a specific
   supplier and a specific basket, not wave at the idea of buying sensors
   somewhere.

What's in it for you, put plainly: a component order from one farm is a
once-off. A referenced BOM is the same SKUs ordered again by every farm that
switches sensing on, and again when something needs replacing. It costs you
nothing to be the default, and it sends people to you already knowing what
they came for.

To be straight about where I am: the ingestion pipeline is in development, not
finished, and isibaya is early. I'm not claiming a pipeline of orders on day
one. I'd rather have this conversation before I've built against the wrong
hardware than after.

If there's interest, I'm happy to send the draft parts list and set up a call,
or come through to the Centurion branch.

Regards,
Siyanda Edwana
isibaya
https://isibaya.smartpick.co.za
siyanda@smartpick.co.za

---

## Before sending

- Find the right recipient on their site — a named person beats a generic
  sales address. They have a contact form; a trade/reseller enquiry may have
  its own route.
- Have the draft BOM ready. The email offers it twice, so the first reply will
  ask for it, and a same-day answer is worth a lot.
- Decide your trade-terms position before the call: are you reselling kits at
  a margin, or staying a pure referrer? That changes the ask.
- Don't claim working MQTT/HTTP ingestion until it exists. The current firmware
  snippets point at broker.isibaya.io and api.isibaya.io, neither of which is
  live or on a domain we own.
