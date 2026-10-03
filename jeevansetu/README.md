# JeevanSetu

## Run
```
npm install
npm run dev          # site http://localhost:5173 | API http://localhost:3000
```
Works immediately in **DEMO mode**: open `/#/request/AMB-101` in one tab and `/#/whatsapp` in another.
The WhatsApp window shows what each hospital receives. Tap Accept there, the first hospital wins.

## Go live with real WhatsApp (Meta Cloud API)
1. https://developers.facebook.com > Create app (Business) > add **WhatsApp**.
2. WhatsApp > API Setup: copy the **temporary access token** and **Phone number ID**.
3. In "To", add your hospital test phone numbers and verify them (test mode allows 5).
4. Copy `.env.example` to `.env` and fill WA_TOKEN, WA_PHONE_ID. Put those same numbers
   (country code, no +, e.g. 919876543210) into `server/hospitals.json`.
5. Expose your site: `ngrok http 5173` (site) and a second tunnel `ngrok http 3000` (API). Put the 5173 URL in BASE_URL.
6. WhatsApp > Configuration > Webhook: Callback URL `https://<ngrok-3000>/webhook`, Verify token = VERIFY_TOKEN
   (default `jeevansetu`), subscribe to **messages**.
7. From each hospital phone, send "hi" to the test number once (opens the 24-hour window).
8. Restart `npm run dev`. The terminal prints `WhatsApp: LIVE`.

For production, create an approved template (4 body variables + two quick-reply buttons)
and set WA_TEMPLATE so alerts work outside the 24-hour window.
