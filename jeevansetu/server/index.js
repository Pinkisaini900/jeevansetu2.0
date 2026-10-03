import "dotenv/config";
import express from "express";
import { readFileSync } from "fs";

const app = express();
app.use(express.json());
const { WA_TOKEN, WA_PHONE_ID, VERIFY_TOKEN = "jeevansetu", BASE_URL = "http://localhost:5173", WA_TEMPLATE } = process.env;
const LIVE = !!(WA_TOKEN && WA_PHONE_ID);
const HOSPITALS = JSON.parse(readFileSync(new URL("./hospitals.json", import.meta.url)));
const AMBULANCES = { "AMB-101": { operator: "108 Emergency Services", plate: "UP32 AB 1101" }, "AMB-102": { operator: "108 Emergency Services", plate: "UP32 AB 1102" }, "AMB-103": { operator: "City Care Ambulance", plate: "UP32 CD 2203" }, "AMB-104": { operator: "City Care Ambulance", plate: "UP32 CD 2204" } };
const reqs = new Map(), chats = {};
HOSPITALS.forEach(h => (chats[h.id] = []));
const hav = (a, b, c, d) => { const r = x => x * Math.PI / 180, h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
const hosp = id => HOSPITALS.find(h => h.id === id);
const say = (hid, m) => chats[hid]?.push({ t: Date.now(), ...m });

/* ---------- WhatsApp Cloud API ---------- */
async function wa(body) {
  if (!LIVE) return { ok: false };
  try {
    const r = await fetch(`https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }) });
    const j = await r.json();
    if (!r.ok) console.error("WhatsApp error:", JSON.stringify(j.error || j));
    return { ok: r.ok, j };
  } catch (e) { console.error("WhatsApp fetch failed:", e.message); return { ok: false }; }
}
const text = (to, t) => wa({ to, type: "text", text: { body: t } });

async function alertHospital(s, h) {
  const km = hav(s.lat, s.lng, h.lat, h.lng).toFixed(1);
  const link = `${BASE_URL}/#/track/${s.id}`;
  const body = `🚨 EMERGENCY – ${s.condition}\nPatient: ${s.name}, ${s.age} yrs\nSymptoms: ${s.symptoms}\nContact: ${s.phone}\nDistance: ${km} km${s.amb ? `\nAmbulance: ${s.amb}` : ""}\nLive tracking: ${link}\n\nCan you accept this case?`;
  say(h.id, { from: "bot", text: body, reqId: s.id, alert: true });
  if (!LIVE) return;
  const res = await wa({ to: h.phone, type: "interactive", interactive: { type: "button", body: { text: body },
    action: { buttons: [{ type: "reply", reply: { id: `A|${s.id}|${h.id}`, title: "Accept" } }, { type: "reply", reply: { id: `R|${s.id}|${h.id}`, title: "Reject" } }] } } });
  if (!res.ok && WA_TEMPLATE) { // 24h window closed -> approved template with quick-reply buttons
    await wa({ to: h.phone, type: "template", template: { name: WA_TEMPLATE, language: { code: "en" }, components: [
      { type: "body", parameters: [s.name, s.age, s.symptoms, link].map(t => ({ type: "text", text: String(t) })) },
      { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: `A|${s.id}|${h.id}` }] },
      { type: "button", sub_type: "quick_reply", index: "1", parameters: [{ type: "payload", payload: `R|${s.id}|${h.id}` }] }] } });
  }
}

/* ---------- Core logic: first hospital to accept wins ---------- */
function respond(id, hid, action) {
  const s = reqs.get(id), h = hosp(hid);
  if (!s || !h) return { ok: false, reason: "notfound" };
  if (s.assigned === hid) return { ok: true };
  if (action === "reject") { s.resp[hid] = "rejected"; say(hid, { from: "me", text: "Reject" }); say(hid, { from: "bot", text: "Noted. Thank you." }); return { ok: true }; }
  say(hid, { from: "me", text: "Accept" });
  if (s.assigned) { const m = "Another hospital has already accepted this case. Thank you."; say(hid, { from: "bot", text: m }); text(h.phone, m); return { ok: false, reason: "taken" }; }
  s.assigned = hid; s.status = "accepted";
  const ok = `✅ Case confirmed. Please prepare the emergency team.\nTrack ambulance: ${BASE_URL}/#/track/${id}`;
  say(hid, { from: "bot", text: ok }); text(h.phone, ok);
  s.notified.filter(x => x !== hid).forEach(o => { const m = "Case assigned to another hospital. Thank you."; say(o, { from: "bot", text: m }); text(hosp(o).phone, m); });
  const a = { ...s.location }; // demo: ambulance drives to the hospital (real GPS can POST /api/location/:id)
  const t = setInterval(() => {
    s.location = { lat: s.location.lat + (h.lat - a.lat) * 0.04, lng: s.location.lng + (h.lng - a.lng) * 0.04 };
    if (hav(s.location.lat, s.location.lng, h.lat, h.lng) < 0.1) clearInterval(t);
  }, 1000);
  return { ok: true };
}

/* ---------- API ---------- */
app.get("/api/config", (q, r) => r.json({ whatsapp: LIVE }));
app.get("/api/ambulance/:code", (q, r) => AMBULANCES[q.params.code] ? r.json({ code: q.params.code, ...AMBULANCES[q.params.code] }) : r.sendStatus(404));
app.get("/api/hospitals", (q, r) => {
  const lat = +q.query.lat, lng = +q.query.lng;
  r.json(HOSPITALS.filter(h => h.sp === "cardiology").map(h => ({ id: h.id, name: h.name, km: +hav(lat, lng, h.lat, h.lng).toFixed(1) })).sort((a, b) => a.km - b.km));
});

app.post("/api/request", (q, r) => {
  const { hospitalIds = [], ...p } = q.body;
  const id = Math.random().toString(36).slice(2, 8);
  const s = { id, ...p, notified: [...hospitalIds], status: "pending", assigned: null, resp: {}, location: { lat: p.lat, lng: p.lng }, at: Date.now() };
  reqs.set(id, s);
  s.notified.forEach(h => alertHospital(s, hosp(h)));
  setTimeout(() => { // no reply in 60s -> alert the remaining cardiology hospitals
    if (s.assigned) return;
    HOSPITALS.filter(h => h.sp === "cardiology" && !s.notified.includes(h.id)).forEach(h => { s.notified.push(h.id); alertHospital(s, h); });
  }, 60000);
  r.json({ id });
});

app.get("/api/status/:id", (q, r) => {
  const s = reqs.get(q.params.id); if (!s) return r.sendStatus(404);
  const h = hosp(s.assigned);
  r.json({ status: s.status, notified: s.notified.length, location: s.location, hospital: h && { name: h.name, lat: h.lat, lng: h.lng } });
});

const stateOf = (s, hid) => s.assigned === hid ? "accepted" : s.assigned ? "taken" : s.resp[hid] || "pending";
app.get("/api/hospital/:hid/requests", (q, r) => {
  const h = hosp(q.params.hid);
  r.json([...reqs.values()].filter(s => s.notified.includes(h?.id)).sort((a, b) => b.at - a.at).map(s => ({
    id: s.id, name: s.name, age: s.age, phone: s.phone, symptoms: s.symptoms, condition: s.condition, amb: s.amb,
    km: +hav(s.lat, s.lng, h.lat, h.lng).toFixed(1), state: stateOf(s, h.id) })));
});
app.get("/api/whatsapp/:hid", (q, r) => r.json((chats[q.params.hid] || []).map(m => m.alert ? { ...m, state: stateOf(reqs.get(m.reqId), q.params.hid) } : m)));
app.post("/api/respond", (q, r) => r.json(respond(q.body.id, q.body.hid, q.body.action)));
app.post("/api/location/:id", (q, r) => { const s = reqs.get(q.params.id); if (s) s.location = q.body; r.sendStatus(200); });

/* ---------- WhatsApp webhook (Meta calls this when a hospital taps Accept/Reject) ---------- */
app.get("/webhook", (q, r) => q.query["hub.verify_token"] === VERIFY_TOKEN ? r.send(q.query["hub.challenge"]) : r.sendStatus(403));
app.post("/webhook", (q, r) => {
  r.sendStatus(200);
  for (const e of q.body.entry || []) for (const c of e.changes || []) for (const m of c.value?.messages || []) {
    const id = m.interactive?.button_reply?.id || m.button?.payload;
    if (!id) continue;
    const [a, rid, hid] = id.split("|");
    respond(rid, hid, a === "A" ? "accept" : "reject");
  }
});

app.use(express.static("dist"));
app.listen(3000, () => console.log(`API on http://localhost:3000 | WhatsApp: ${LIVE ? "LIVE" : "DEMO mode (add .env to go live)"}`));
