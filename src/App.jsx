import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import LiveStatus from "./LiveStatus.jsx";

const AMBS = ["AMB-101", "AMB-102", "AMB-103", "AMB-104"];
const useRoute = () => {
  const [h, setH] = useState(location.hash || "#/");
  useEffect(() => { const f = () => { setH(location.hash || "#/"); scrollTo(0, 0); }; addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  return h.slice(1).split("/").filter(Boolean);
};
const post = (u, b) => fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(r => r.json());

function Nav({ page, theme, setTheme }) {
  const L = [["", "Home"], ["ambulance", "Ambulance QR"], ["whatsapp", "WhatsApp"], ["hospital", "For hospitals"]];
  return <nav><a href="#/" className="logo"><span className="lg">♥</span> JeevanSetu</a>
    <div className="links">{L.map(([k, t]) => <a key={k} href={"#/" + k} className={page === k ? "act" : ""}>{t}</a>)}</div>
    <button className="tg" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀️" : "🌙"}</button><a className="btn sm" href="#/request">🚨 Emergency</a></nav>;
}

function Words({ text, base = 0 }) {
  return text.split(" ").map((w, i) => <span className="w" key={i} style={{ animationDelay: (base + i) * 0.045 + "s" }}>{w}</span>);
}
function Reveal({ children, d = 0 }) {
  const ref = useRef(null), [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(ref.current); return () => io.disconnect();
  }, []);
  return <div ref={ref} className={"rv " + (on ? "in" : "")} style={{ "--d": d + "s" }}>{children}</div>;
}
function Feature({ ic, t, s, pts }) {
  const [hov, setHov] = useState(false), [pin, setPin] = useState(false), open = hov || pin;
  const tilt = e => { const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; e.currentTarget.style.transform = `perspective(800px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-6px)`; };
  return <div className={"card fc " + (open ? "open" : "")} role="button" tabIndex={0}
    onMouseEnter={() => setHov(true)} onMouseMove={tilt} onMouseLeave={e => { setHov(false); e.currentTarget.style.transform = ""; }} onClick={() => setPin(!pin)} onKeyDown={e => e.key === "Enter" && setPin(!pin)}>
    <div className="ic">{ic}</div><h3>{t}</h3><p>{s}</p>
    <div className="fd">{open && <ul>{pts.map((p, i) => <li key={i} style={{ animationDelay: i * 0.2 + "s" }}>{p}</li>)}</ul>}</div>
    <span className="more">{open ? "Tap to close" : "Hover or tap for details"}</span></div>;
}
const FEATS = [
  ["📍", "Right speciality", "Only the hospitals that can treat a heart attack.", ["Only cardiology hospitals are listed", "Nearest hospital comes first", "You can select or skip any hospital"]],
  ["📣", "Everyone alerted at once", "No calling around. One request reaches all of them.", ["Sent on WhatsApp instantly", "Hospital taps Accept or Reject", "More hospitals auto-alerted after 60 seconds"]],
  ["⚡", "First to accept wins", "One hospital is confirmed within moments.", ["The first Accept confirms the case", "Other hospitals are released automatically", "No double booking, no confusion"]],
  ["🗺️", "Live ambulance tracking", "Hospital and family watch the ambulance in real time.", ["Ambulance moves live on the map", "ETA updates automatically", "Share the tracking link with family"]],
];
const STEPS = [
  ["📱", "Scan", "Scan the QR code inside the ambulance with any phone camera.", "It opens the request form, already linked to that verified ambulance."],
  ["📝", "Fill", "Enter the patient's name, age and main symptom.", "It takes under 30 seconds. Symptoms are one-tap chips."],
  ["📣", "Alert", "Choose the nearby cardiology hospitals.", "They are alerted on WhatsApp at once, with Accept and Reject buttons."],
  ["🏥", "Arrive", "The first hospital to accept prepares the emergency team.", "Everyone else is released, and you track the ambulance live."],
];
function Steps() {
  const [i, setI] = useState(0); const cur = STEPS[i]; let base = 0;
  return <div className="stp"><div className="stp-l">{STEPS.map((s, k) => <button key={k} className={"stp-b " + (k === i ? "on" : "")} onMouseEnter={() => setI(k)} onClick={() => setI(k)}><span className="num">{k + 1}</span>{s[1]}</button>)}</div>
    <div className="stp-r card" key={i}><div className="ic">{cur[0]}</div><h3>{cur[1]}</h3>
      {cur.slice(2).map((l, k) => { const b = base; base += l.split(" ").length; return <p key={k}><Words text={l} base={b} /></p>; })}</div></div>;
}

function HW({ t, o = 0 }) {
  return t.split(" ").map((w, i) => <span className="hw" key={i} style={{ animationDelay: (o + i) * 0.12 + "s" }}>{w}</span>);
}
function Scene() {
  const ref = useRef(null);
  const mv = e => { const r = ref.current.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; ref.current.style.setProperty("--ry", x * 30); ref.current.style.setProperty("--rx", -y * 20); };
  const lv = () => { ref.current.style.setProperty("--ry", 0); ref.current.style.setProperty("--rx", 0); };
  const items = [["📱", "Scan QR"], ["📝", "Patient details"], ["💬", "WhatsApp alert"], ["✅", "Hospital accepts"], ["🚑", "Live tracking"], ["🏥", "Ready on arrival"]];
  return <div className="scene" ref={ref} onMouseMove={mv} onMouseLeave={lv}>
    <div className="world">
      <div className="c3d">{items.map((it, i) => <div className="c3i" key={i} style={{ "--i": i }}><span>{it[0]}</span>{it[1]}</div>)}</div>
      <div className="core"><i className="pr p1" /><i className="pr p2" /><div className="heart">♥</div></div>
    </div>
    <svg className="ecg" viewBox="0 0 400 80" preserveAspectRatio="none"><path pathLength="100" d="M0 40 L70 40 L82 40 L92 10 L106 70 L118 40 L200 40 L212 40 L222 22 L234 58 L244 40 L400 40" /></svg>
  </div>;
}

function Home() {
  const feats = [["📍", "Right speciality", "Only hospitals with cardiology are alerted, sorted by distance."],
    ["📣", "Everyone alerted at once", "No calling around. One request reaches every matching hospital."],
    ["⚡", "First to accept wins", "One hospital is confirmed. The others are released instantly."],
    ["🗺️", "Live ambulance tracking", "Hospital and family watch the ambulance and ETA in real time."]];
  const steps = [["Scan", "Scan the QR code inside the ambulance with any phone camera."], ["Fill", "Enter the patient's name, age and main symptom. It takes under 30 seconds."],
    ["Alert", "Choose nearby cardiology hospitals. They are alerted immediately."], ["Arrive", "The first hospital to accept prepares the team. Track the ambulance live."]];
  return <>
    <section className="hero"><div className="hero-grid"><div className="hero-in">
      <span className="pill"><i className="dot" /> Built for the golden hour</span>
      <h1><HW t="The right hospital," /><em className="hw" style={{ animationDelay: "0.5s" }}>before</em><HW t="the ambulance arrives." o={5} /></h1>
      <p>In a heart attack, every minute of delay costs heart muscle. JeevanSetu alerts nearby cardiology hospitals the moment a patient is in the ambulance, and confirms one that is ready.</p>
      <div className="cta"><a className="btn lg sos" href="#/request/AMB-101">🚨 Start emergency request</a><a className="btn ghost lg" href="#/ambulance">See the ambulance QR</a></div>
      <div className="stats"><div><b>1 scan</b><span>to start</span></div><div><b>Many</b><span>hospitals alerted</span></div><div><b>1</b><span>confirmed fast</span></div></div>
    </div><Scene /></div></section>
    <section className="sec"><h2>Why JeevanSetu</h2><div className="grid">{FEATS.map((f, i) => <Reveal key={f[1]} d={i * 0.12}><Feature ic={f[0]} t={f[1]} s={f[2]} pts={f[3]} /></Reveal>)}</div></section>
    <section className="sec"><h2>How it works</h2><Reveal><Steps /></Reveal><p className="hint center">Hover or tap a step to see the details.</p></section>
    <section className="sec band"><div><h2>Every ambulance carries its own QR</h2><p>Print it once and stick it inside the ambulance. Anyone can scan it, and the request is automatically linked to that verified ambulance.</p><a className="btn" href="#/ambulance">Generate ambulance QR →</a></div>
      <div className="qrmini"><QRCodeSVG value={location.origin + "/#/request/AMB-101"} size={130} level="M" /></div></section>
  </>;
}

function AmbulanceQR() {
  const [code, setCode] = useState("AMB-101"), [base, setBase] = useState(location.origin);
  const url = `${base.replace(/\/$/, "")}/#/request/${code}`;
  return <section className="wrap"><div className="head"><h1>Ambulance QR code</h1><p>Print this and place it inside the ambulance. Patients or attendants scan it to start a request.</p></div>
    <div className="two-col">
      <div className="card"><label>Select ambulance<select value={code} onChange={e => setCode(e.target.value)}>{AMBS.map(a => <option key={a}>{a}</option>)}</select></label>
        <label>Website address<input value={base} onChange={e => setBase(e.target.value)} /></label>
        <p className="hint">To scan with a phone on the same Wi-Fi, replace localhost with your computer's IP, e.g. <b>http://192.168.1.5:5173</b>.</p>
        <div className="urlbox">{url}</div>
        <div className="row"><button className="btn" onClick={() => print()}>🖨️ Print poster</button><a className="btn ghost" href={`#/request/${code}`}>Test the link</a></div></div>
      <div className="poster" id="poster"><div className="ph">♥ JeevanSetu</div><h2>Heart attack emergency?</h2><p>Scan to alert the right hospital</p>
        <div className="qrbox"><QRCodeSVG value={url} size={220} level="H" includeMargin /></div>
        <div className="pc">{code}</div><small>Open your phone camera and point it at the code</small></div>
    </div></section>;
}

function Request({ amb }) {
  const [step, setStep] = useState(1), [f, setF] = useState({ name: "", age: "", phone: "", symptoms: "Severe chest pain" });
  const [pos, setPos] = useState(null), [list, setList] = useState([]), [sel, setSel] = useState([]), [busy, setBusy] = useState(false), [info, setInfo] = useState(null);
  useEffect(() => { if (amb) fetch("/api/ambulance/" + amb).then(r => r.ok ? r.json() : null).then(setInfo).catch(() => {}); }, [amb]);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const ok = f.name && f.age && /^\d{10}$/.test(f.phone);
  async function next(e) {
    e.preventDefault(); setBusy(true);
    const p = await new Promise(res => navigator.geolocation ? navigator.geolocation.getCurrentPosition(g => res({ lat: g.coords.latitude, lng: g.coords.longitude }), () => res({ lat: 26.8467, lng: 80.9462 }), { timeout: 4000 }) : res({ lat: 26.8467, lng: 80.9462 }));
    const hs = await fetch(`/api/hospitals?lat=${p.lat}&lng=${p.lng}`).then(r => r.json());
    setPos(p); setList(hs); setSel(hs.map(h => h.id)); setStep(2); setBusy(false);
  }
  async function send() { setBusy(true); const { id } = await post("/api/request", { ...f, ...pos, amb, condition: "Heart Attack", hospitalIds: sel }); location.hash = `#/track/${id}`; }
  return <section className="wrap narrow">
    {info && <div className="verified">✅ <div><b>Ambulance {info.code} verified</b><small>{info.operator} · {info.plate}</small></div></div>}
    <div className="card">
      <div className="stepper"><span className={step >= 1 ? "on" : ""}><i>1</i> Patient</span><span className="ln" /><span className={step >= 2 ? "on" : ""}><i>2</i> Hospitals</span></div>
      {step === 1 ? <form onSubmit={next}><h2>Patient details</h2>
        <label>Patient name<input value={f.name} onChange={set("name")} placeholder="e.g. Ramesh Kumar" autoFocus /></label>
        <div className="two"><label>Age<input type="number" min="1" max="120" value={f.age} onChange={set("age")} placeholder="56" /></label>
          <label>Contact number<input inputMode="numeric" maxLength="10" value={f.phone} onChange={set("phone")} placeholder="10-digit mobile" /></label></div>
        <label>Main symptom</label><div className="chips">{["Severe chest pain", "Shortness of breath and sweating", "Pain in left arm or jaw", "Dizziness and nausea"].map(s => <button type="button" key={s} className={"chip " + (f.symptoms === s ? "on" : "")} onClick={() => setF({ ...f, symptoms: s })}>{s}</button>)}</div>
        <button className="btn full lg" disabled={!ok || busy}>{busy ? "Finding hospitals…" : "Find nearby hospitals →"}</button>
        <p className="hint">🔒 Used only to alert hospitals. We use your location to find the closest cardiology hospitals.</p></form>
      : <><h2>Cardiology hospitals near you</h2><p className="hint">Selected hospitals are alerted on WhatsApp at once. The first to accept is confirmed.</p><WaBadge />
        {list.map((h, i) => <label className={"hosp " + (sel.includes(h.id) ? "sel" : "")} key={h.id}>
          <input type="checkbox" checked={sel.includes(h.id)} onChange={() => setSel(s => s.includes(h.id) ? s.filter(x => x !== h.id) : [...s, h.id])} />
          <span className="hn"><b>{h.name}</b><small>❤️ Cardiology{i === 0 ? " · Nearest" : ""}</small></span><span className="km">{h.km} km</span></label>)}
        <button className="btn full lg sos" onClick={send} disabled={!sel.length || busy}>{busy ? "Sending…" : `🚨 Alert ${sel.length} hospital${sel.length > 1 ? "s" : ""} now`}</button>
        <button className="btn ghost full" onClick={() => setStep(1)}>← Back</button></>}
    </div></section>;
}

function Track({ id }) {
  const [c, setC] = useState(false);
  return <section className="wrap narrow"><div className="head"><span className="pill"><i className="dot" /> Emergency in progress</span><h1>Tracking your ambulance</h1></div>
    <LiveStatus id={id} />
    <div className="share card"><div><b>Share with family</b><small>Request ID: {id}</small></div>
      <button className="btn ghost sm" onClick={() => { navigator.clipboard?.writeText(location.href); setC(true); setTimeout(() => setC(false), 1800); }}>{c ? "Copied ✓" : "Copy link"}</button></div></section>;
}

function Hospital() {
  const [hid, setHid] = useState("h1"), [rows, setRows] = useState([]);
  const load = () => fetch(`/api/hospital/${hid}/requests`).then(r => r.json()).then(setRows).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 2500); return () => clearInterval(t); }, [hid]);
  const act = async (id, action) => { await post("/api/respond", { id, hid, action }); load(); };
  const n = s => rows.filter(r => r.state === s).length;
  return <section className="wrap narrow wide"><div className="head"><h1>Hospital console</h1><p>Incoming heart attack emergencies appear here automatically.</p></div>
    <div className="card"><label>Signed in as<select value={hid} onChange={e => setHid(e.target.value)}>
      {[["h1", "City Heart Hospital"], ["h2", "Lucknow Cardio Care"], ["h3", "Apex Cardiac Centre"], ["h4", "Sanjeevani Heart Institute"]].map(h => <option key={h[0]} value={h[0]}>{h[1]}</option>)}</select></label>
      <div className="kpis"><div><b>{n("pending")}</b>Waiting</div><div><b>{n("accepted")}</b>Accepted</div><div><b>{n("taken")}</b>Taken by others</div></div></div>
    {!rows.length && <div className="empty">🩺<p>No incoming emergencies right now.</p></div>}
    {rows.map(r => <div className={"card inc " + r.state} key={r.id}>
      <div className="inc-h"><b>🚨 {r.condition}</b><span className={"tag " + r.state}>{r.state}</span></div>
      <p className="big">{r.name}, {r.age} yrs</p><p className="mut">{r.symptoms}</p>
      <p className="mut">📞 {r.phone} · 📍 {r.km} km away{r.amb ? ` · 🚑 ${r.amb}` : ""}</p>
      {r.state === "pending" && <div className="two"><button className="btn ok" onClick={() => act(r.id, "accept")}>Accept case</button><button className="btn ghost" onClick={() => act(r.id, "reject")}>Reject</button></div>}
      {r.state === "accepted" && <p className="good">Confirmed. Prepare the emergency team. <a href={`#/track/${r.id}`}>Track ambulance →</a></p>}
      {r.state === "taken" && <p className="hint">Another hospital accepted this case.</p>}</div>)}</section>;
}

function WaBadge() {
  const [live, setLive] = useState(null);
  useEffect(() => { fetch("/api/config").then(r => r.json()).then(c => setLive(c.whatsapp)).catch(() => {}); }, []);
  if (live === null) return null;
  return <span className={"wab " + (live ? "live" : "demo")}>{live ? "● WhatsApp live" : "● WhatsApp demo mode"}</span>;
}

function WhatsApp() {
  const HS = [["h1", "City Heart Hospital"], ["h2", "Lucknow Cardio Care"], ["h3", "Apex Cardiac Centre"], ["h4", "Sanjeevani Heart Institute"]];
  const [hid, setHid] = useState("h1"), [msgs, setMsgs] = useState([]);
  const load = () => fetch(`/api/whatsapp/${hid}`).then(r => r.json()).then(setMsgs).catch(() => {});
  useEffect(() => { setMsgs([]); load(); const t = setInterval(load, 1500); return () => clearInterval(t); }, [hid]);
  useEffect(() => { const el = document.getElementById("wa-body"); if (el) el.scrollTop = el.scrollHeight; }, [msgs]);
  const act = async (id, action) => { await post("/api/respond", { id, hid, action }); load(); };
  const tm = t => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return <section className="wrap"><div className="head"><h1>Hospital WhatsApp window</h1><p>This is exactly what each hospital sees on WhatsApp. Tap Accept or Reject like a real hospital would.</p><WaBadge /></div>
    <div className="wa-layout">
      <div className="wa-tabs">{HS.map(([k, n]) => <button key={k} className={hid === k ? "on" : ""} onClick={() => setHid(k)}><span className="av">{n[0]}</span>{n}</button>)}</div>
      <div className="wa-phone"><div className="wa-top"><span className="av g">♥</span><div><b>JeevanSetu Alerts <i>✔</i></b><small>Business account · viewing as {HS.find(h => h[0] === hid)[1]}</small></div></div>
        <div className="wa-body" id="wa-body">
          {!msgs.length && <div className="wa-sys">No messages yet. Send an emergency request from the Emergency page.</div>}
          {msgs.map((m, i) => <div key={i} className={"wa-row " + (m.from === "me" ? "me" : "")}><div className={"wa-b " + (m.from === "me" ? "me" : "")}>
            <span style={{ whiteSpace: "pre-line" }}>{m.text}</span><em>{tm(m.t)}{m.from === "me" ? " ✓✓" : ""}</em>
            {m.alert && m.state === "pending" && <div className="wa-btns"><button onClick={() => act(m.reqId, "accept")}>Accept</button><button onClick={() => act(m.reqId, "reject")}>Reject</button></div>}
            {m.alert && m.state !== "pending" && <div className="wa-done">{m.state === "accepted" ? "You accepted this case" : m.state === "taken" ? "Taken by another hospital" : "You rejected this case"}</div>}</div></div>)}</div>
        <div className="wa-in">Replies are handled with the buttons above</div></div>
    </div></section>;
}

export default function App() {
  const [p = "", a] = useRoute();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("theme", theme); }, [theme]);
  return <><Nav page={p === "request" || p === "track" ? "" : p} theme={theme} setTheme={setTheme} />
    <main>{p === "request" ? <Request amb={a} /> : p === "track" ? <Track id={a} /> : p === "whatsapp" ? <WhatsApp /> : p === "hospital" ? <Hospital /> : p === "ambulance" ? <AmbulanceQR /> : <Home />}</main>
    <footer>♥ JeevanSetu · Connecting patients to the right hospital in the golden hour.<br /><b>Version 4.0 · 3D theme</b></footer></>;
}
