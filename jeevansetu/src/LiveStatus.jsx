import { useEffect, useState } from "react";
import "./LiveStatus.css";

const hav = (a, b, c, d) => {
  const r = (x) => (x * Math.PI) / 180;
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

function Map({ loc, hosp }) {
  const W = 400, H = 300;
  const pts = [loc, hosp].filter(Boolean);
  const la = pts.map((p) => p.lat), ln = pts.map((p) => p.lng);
  const cy = (Math.min(...la) + Math.max(...la)) / 2;
  const cx = (Math.min(...ln) + Math.max(...ln)) / 2;
  const cl = Math.cos((cy * Math.PI) / 180);
  const dy = Math.max(Math.max(...la) - Math.min(...la), 0.008) * 1.5;
  const dx = Math.max((Math.max(...ln) - Math.min(...ln)) * cl, 0.008) * 1.5;
  const s = Math.min(W / dx, H / dy);
  const X = (g) => W / 2 + (g - cx) * cl * s;
  const Y = (a) => H / 2 - (a - cy) * s;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="js-map">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => <line key={"v" + i} x1={i * 50} y1="0" x2={i * 50} y2={H} className="js-rd" />)}
      {[1, 2, 3, 4, 5].map((i) => <line key={"h" + i} x1="0" y1={i * 50} x2={W} y2={i * 50} className="js-rd" />)}
      {hosp && (
        <>
          <line x1={X(loc.lng)} y1={Y(loc.lat)} x2={X(hosp.lng)} y2={Y(hosp.lat)} stroke="#1a73e8" strokeWidth="3" strokeDasharray="6 4" />
          <circle cx={X(hosp.lng)} cy={Y(hosp.lat)} r="8" fill="#d32f2f" />
          <text x={X(hosp.lng)} y={Y(hosp.lat) + 4} fontSize="11" fill="#fff" textAnchor="middle">+</text>
          <text className="js-lbl" x={Math.min(330, Math.max(70, X(hosp.lng)))} y={Y(hosp.lat) > 260 ? Y(hosp.lat) - 16 : Y(hosp.lat) + 26} fontSize="11" textAnchor="middle">{hosp.name.length > 24 ? hosp.name.slice(0, 23) + "…" : hosp.name}</text>
        </>
      )}
      <text x={X(loc.lng)} y={Y(loc.lat) + 7} fontSize="22" textAnchor="middle">🚑</text>
    </svg>
  );
}

/**
 * Props:
 *  id       - request id (/api/request se mila)
 *  apiBase  - backend URL (same server ho to "")
 *  pollMs   - kitni der mein refresh (default 4000)
 */
export default function LiveStatus({ id, apiBase = "", pollMs = 4000 }) {
  const [s, setS] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    let stop = false, timer;
    const poll = async () => {
      try {
        const r = await fetch(`${apiBase}/api/status/${id}`);
        if (r.ok && !stop) {
          const d = await r.json();
          setS(d);
          if (d.status === "accepted" && d.hospital &&
              hav(d.location.lat, d.location.lng, d.hospital.lat, d.hospital.lng) < 0.15) {
            setDone(true);
            return; // polling band
          }
        }
      } catch (e) { console.error(e); }
      if (!stop) timer = setTimeout(poll, pollMs);
    };
    poll();
    return () => { stop = true; clearTimeout(timer); };
  }, [id, apiBase, pollMs]);

  if (!s) return <div className="js-live"><h2>📍 Live Status</h2><p>Loading...</p></div>;

  const acc = s.status === "accepted" && s.hospital;
  const km = acc ? hav(s.location.lat, s.location.lng, s.hospital.lat, s.hospital.lng) : 0;
  const eta = Math.max(1, Math.round((km * 1.3) / 35 * 60));

  return (
    <div className="js-live">
      <h2>📍 Live Status</h2>
      <div className="js-step on">
        ✅ Request sent to {s.notified ? `${s.notified} cardiology hospitals` : "nearby cardiology hospitals"}
      </div>
      <div className={"js-step " + (acc ? "on" : "")}>
        {acc ? `✅ ${s.hospital.name} accepted your request` : "⏳ Waiting for a hospital to accept…"}
      </div>
      <div className={"js-step " + (acc ? "on" : "")}>
        {done ? "✅ Ambulance has reached the hospital. Team is ready!"
          : acc ? "🚑 Ambulance is on the way to the hospital"
          : "🚑 Route appears once a hospital confirms"}
      </div>
      {acc && !done && (
        <div>ETA: <span className="js-eta">{eta} min</span> <small>({km.toFixed(1)} km)</small></div>
      )}
      <Map loc={s.location} hosp={acc ? s.hospital : null} />
    </div>
  );
}
