import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

/**
 * StreamSmart signup page
 *
 * Props (all optional):
 *  - apiUrl:        defaults to import.meta.env.VITE_API_URL
 *  - onSwitchToLogin: called when the user goes to the login page (use navigate("/login") with react-router)
 *  - onSuccess:     called after the account is created
 *
 * Posts { name, email, password } to `${apiUrl}/api/auth/register`.
 * `role` is intentionally not sent: your User model defaults it to "viewer".
 */

const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000";

/* Quality ladder used by both the logo and the password meter */
const LADDER = [
  { label: "360p", color: "#FFB547" },
  { label: "720p", color: "#4C9DFF" },
  { label: "1080p", color: "#35E0B0" },
];

/* A fake ABR session: each segment is fetched at a quality (0,1,2) */
const SESSION = [2, 2, 2, 1, 1, 0, 0, 1, 1, 2, 2, 2, 1, 0, 0, 0, 1, 2, 2, 2, 1, 1, 2, 2];

function scorePassword(pw) {
  if (pw.length < 6) return -1; // below the model's minlength
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;
  return s >= 4 ? 2 : s >= 2 ? 1 : 0;
}

function Logo({ size = 44 }) {
  return (
    <svg className="ss-logo" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="1" y="1" width="46" height="46" rx="13" fill="#12233A" stroke="#27405F" />
      <path className="ss-logo-play" d="M19 14.5v19l15-9.5-15-9.5z" fill="#fff" />
      <rect className="ss-bar b1" x="7" y="30" width="3" height="8" rx="1.5" fill={LADDER[0].color} />
      <rect className="ss-bar b2" x="7" y="22" width="3" height="16" rx="1.5" fill={LADDER[1].color} />
      <rect className="ss-bar b3" x="7" y="12" width="3" height="26" rx="1.5" fill={LADDER[2].color} />
    </svg>
  );
}

function SegmentStrip({ reduced }) {
  const [tick, setTick] = useState(reduced ? SESSION.length : 0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setTick((t) => (t >= SESSION.length + 6 ? 0 : t + 1)), 420);
    return () => clearInterval(id);
  }, [reduced]);

  const loaded = Math.min(tick, SESSION.length);
  const current = SESSION[Math.max(0, Math.min(loaded - 1, SESSION.length - 1))];

  return (
    <div className="ss-strip">
      <div className="ss-strip-head">
        <span>Fetching segment {Math.max(loaded, 1)} of {SESSION.length}</span>
        <span className="ss-now" style={{ color: LADDER[current].color }}>
          {LADDER[current].label}
        </span>
      </div>
      <div className="ss-segs">
        {SESSION.map((q, i) => (
          <span
            key={i}
            className={`ss-seg ${i < loaded ? "on" : ""}`}
            style={{ "--c": LADDER[q].color, height: 14 + q * 8 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Signup({ apiUrl = API_URL, onSwitchToLogin, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const strength = scorePassword(form.password);
  const mismatch = form.confirm.length > 0 && form.confirm !== form.password;

  const update = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (error) setError("");
  };

  const goLogin = (e) => {
    if (onSwitchToLogin) {
      e.preventDefault();
      onSwitchToLogin();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords don't match.");

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not create the account. Try again.");

      setDone(true);
      onSuccess?.(data);
      setTimeout(() => {
        if (onSwitchToLogin) onSwitchToLogin();
        else window.location.href = "/login";
      }, 1600);
    } catch (err) {
      setError(err.message || "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ss-root">
      <style>{css}</style>

      {/* Left: the product, shown rather than described */}
      <aside className="ss-side">
        <div className="ss-glow" />
        <div className="ss-brand">
          <Logo />
          <span>StreamSmart</span>
        </div>

        <div className="ss-hero">
          <h1>Video that adapts before your viewers notice.</h1>
          <p>
            Compare fixed quality with adaptive bitrate on the same HLS stream, under the same
            network conditions.
          </p>

          <svg className="ss-wave" viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0" y1="25" x2="400" y2="25" className="ss-guide" />
            <line x1="0" y1="55" x2="400" y2="55" className="ss-guide" />
            <path
              className="ss-wave-line"
              pathLength="1"
              d="M0 20 C30 18 50 24 80 22 S130 30 150 48 S190 78 230 72 S280 40 310 34 S360 18 400 22"
            />
          </svg>
          <div className="ss-wave-legend">
            <span>Network bandwidth</span>
            <span>
              <i style={{ background: LADDER[2].color }} />1080p
              <i style={{ background: LADDER[1].color }} />720p
              <i style={{ background: LADDER[0].color }} />360p
            </span>
          </div>

          <SegmentStrip reduced={reduced} />
        </div>

        <div className="ss-foot">HLS · Adaptive bitrate · Edge caching · Playback telemetry</div>
      </aside>

      {/* Right: the form */}
      <main className="ss-main">
        <div className="ss-card">
          <div className="ss-mobile-brand">
            <Logo size={36} />
            <span>StreamSmart</span>
          </div>

          {done ? (
            <div className="ss-done" role="status">
              <CheckCircle2 size={44} color={LADDER[2].color} />
              <h2>Account created</h2>
              <p>Taking you to sign in…</p>
            </div>
          ) : (
            <>
              <h2 className="ss-title">Create your account</h2>
              <p className="ss-sub">Start running streaming experiments in a few minutes.</p>

              <form onSubmit={handleSubmit} noValidate>
                <label className="ss-field">
                  <span>Full name</span>
                  <div className="ss-input">
                    <User size={18} />
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Asha Verma"
                      value={form.name}
                      onChange={update("name")}
                    />
                  </div>
                </label>

                <label className="ss-field">
                  <span>Email</span>
                  <div className="ss-input">
                    <Mail size={18} />
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={update("email")}
                    />
                  </div>
                </label>

                <label className="ss-field">
                  <span>Password</span>
                  <div className="ss-input">
                    <Lock size={18} />
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={update("password")}
                    />
                    <button
                      type="button"
                      className="ss-eye"
                      onClick={() => setShow((s) => !s)}
                      aria-label={show ? "Hide password" : "Show password"}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password strength expressed as the quality ladder */}
                  <div className="ss-meter" aria-live="polite">
                    <div className="ss-meter-bars">
                      {LADDER.map((l, i) => (
                        <span
                          key={l.label}
                          className={i <= strength ? "on" : ""}
                          style={{ "--c": l.color, height: 6 + i * 4 }}
                        />
                      ))}
                    </div>
                    <small>
                      {form.password.length === 0
                        ? "Strength shows as stream quality"
                        : strength < 0
                        ? "Too short to stream"
                        : `Strength: ${LADDER[strength].label}`}
                    </small>
                  </div>
                </label>

                <label className="ss-field">
                  <span>Confirm password</span>
                  <div className={`ss-input ${mismatch ? "bad" : ""}`}>
                    <Lock size={18} />
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={form.confirm}
                      onChange={update("confirm")}
                    />
                  </div>
                  {mismatch && <small className="ss-warn">Passwords don't match yet.</small>}
                </label>

                {error && (
                  <div className="ss-error" role="alert">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button className="ss-submit" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className="ss-spin" /> Creating account
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>

              <p className="ss-switch">
                Already have an account?{" "}
                <a href="/login" onClick={goLogin}>
                  Sign in
                </a>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600&display=swap');

.ss-root{
  --ink:#0C1828; --panel:#12233A; --line:#27405F; --text:#E8EFF8; --mute:#8FA3BC;
  --blue:#4C9DFF; --mint:#35E0B0; --amber:#FFB547; --bad:#FF6B6B;
  min-height:100vh; display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);
  font-family:'Figtree',system-ui,sans-serif; color:var(--text); background:var(--ink);
}
.ss-root *{box-sizing:border-box}

/* ---------- Left panel ---------- */
.ss-side{position:relative; overflow:hidden; padding:40px 56px; display:flex; flex-direction:column;
  justify-content:space-between; background:linear-gradient(160deg,#102038 0%,#0C1828 70%); border-right:1px solid var(--line)}
.ss-glow{position:absolute; width:520px; height:520px; right:-180px; top:-160px; border-radius:50%;
  background:radial-gradient(circle,rgba(76,157,255,.28),transparent 65%); animation:ss-drift 14s ease-in-out infinite alternate}
.ss-brand{position:relative; display:flex; align-items:center; gap:12px; font-family:'Bricolage Grotesque',sans-serif;
  font-weight:700; font-size:22px; letter-spacing:-.01em}
.ss-hero{position:relative; max-width:520px}
.ss-hero h1{font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:clamp(30px,3.4vw,46px);
  line-height:1.08; letter-spacing:-.025em; margin:0 0 16px}
.ss-hero p{color:var(--mute); font-size:16px; line-height:1.6; margin:0 0 32px; max-width:46ch}
.ss-foot{position:relative; color:var(--mute); font-size:13px}

/* bandwidth line */
.ss-wave{width:100%; height:90px; display:block; overflow:visible}
.ss-guide{stroke:var(--line); stroke-dasharray:3 5; stroke-width:1}
.ss-wave-line{fill:none; stroke:var(--blue); stroke-width:3; stroke-linecap:round; stroke-dasharray:1; stroke-dashoffset:1;
  animation:ss-draw 5s ease-in-out infinite; filter:drop-shadow(0 0 6px rgba(76,157,255,.6))}
.ss-wave-legend{display:flex; justify-content:space-between; font-size:12px; color:var(--mute); margin:8px 0 28px}
.ss-wave-legend i{display:inline-block; width:8px; height:8px; border-radius:50%; margin:0 5px 0 12px}

/* segment strip */
.ss-strip{background:rgba(18,35,58,.7); border:1px solid var(--line); border-radius:14px; padding:16px 18px; backdrop-filter:blur(6px)}
.ss-strip-head{display:flex; justify-content:space-between; font-size:13px; color:var(--mute); margin-bottom:14px}
.ss-now{font-weight:600; transition:color .3s}
.ss-segs{display:flex; align-items:flex-end; gap:4px; height:36px}
.ss-seg{flex:1; border-radius:3px; background:var(--line); opacity:.45; transition:background .25s, opacity .25s, transform .25s}
.ss-seg.on{background:var(--c); opacity:1; transform:scaleY(1)}

/* logo animation: bars step up like a quality ladder, play icon breathes */
.ss-bar{transform-box:fill-box; transform-origin:bottom; animation:ss-ladder 2.4s ease-in-out infinite}
.ss-bar.b2{animation-delay:.25s} .ss-bar.b3{animation-delay:.5s}
.ss-logo-play{transform-box:fill-box; transform-origin:center; animation:ss-breathe 2.4s ease-in-out infinite}

/* ---------- Right panel ---------- */
.ss-main{display:flex; align-items:center; justify-content:center; padding:40px 24px; background:var(--ink)}
.ss-card{width:100%; max-width:420px}
.ss-mobile-brand{display:none; align-items:center; gap:10px; margin-bottom:28px; font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:20px}
.ss-title{font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:32px; letter-spacing:-.02em; margin:0 0 6px}
.ss-sub{color:var(--mute); margin:0 0 28px; font-size:15px}

.ss-field{display:block; margin-bottom:18px}
.ss-field>span{display:block; font-size:13.5px; font-weight:500; margin-bottom:7px; color:#C9D6E6}
.ss-input{display:flex; align-items:center; gap:10px; background:var(--panel); border:1px solid var(--line);
  border-radius:11px; padding:0 14px; height:48px; color:var(--mute); transition:border-color .2s, box-shadow .2s}
.ss-input:focus-within{border-color:var(--blue); box-shadow:0 0 0 3px rgba(76,157,255,.2); color:var(--blue)}
.ss-input.bad{border-color:var(--bad)}
.ss-input input{flex:1; min-width:0; background:none; border:0; outline:0; color:var(--text); font:inherit; font-size:15px}
.ss-input input::placeholder{color:#5F7592}
.ss-eye{background:none; border:0; color:var(--mute); cursor:pointer; display:grid; place-items:center; padding:4px; border-radius:6px}
.ss-eye:hover{color:var(--text)} .ss-eye:focus-visible{outline:2px solid var(--blue)}

.ss-meter{display:flex; align-items:flex-end; gap:12px; margin-top:10px; min-height:18px}
.ss-meter-bars{display:flex; align-items:flex-end; gap:4px}
.ss-meter-bars span{width:8px; border-radius:2px; background:var(--line); transition:background .25s, transform .25s}
.ss-meter-bars span.on{background:var(--c); transform:scaleY(1.08)}
.ss-meter small, .ss-warn{font-size:12.5px; color:var(--mute)}
.ss-warn{display:block; margin-top:7px; color:var(--bad)}

.ss-error{display:flex; align-items:center; gap:8px; background:rgba(255,107,107,.1); border:1px solid rgba(255,107,107,.4);
  color:#FFB3B3; padding:11px 13px; border-radius:10px; font-size:14px; margin-bottom:16px; animation:ss-shake .35s}

.ss-submit{width:100%; height:50px; border:0; border-radius:11px; cursor:pointer; font:inherit; font-weight:600; font-size:15.5px;
  color:#04121F; background:linear-gradient(135deg,var(--mint),var(--blue)); display:flex; align-items:center; justify-content:center;
  gap:8px; transition:transform .15s, filter .2s, box-shadow .2s; box-shadow:0 8px 24px -8px rgba(76,157,255,.6)}
.ss-submit:hover:not(:disabled){transform:translateY(-1px); filter:brightness(1.07)}
.ss-submit:active:not(:disabled){transform:translateY(0)}
.ss-submit:disabled{opacity:.7; cursor:progress}
.ss-submit:focus-visible{outline:2px solid #fff; outline-offset:3px}
.ss-spin{animation:ss-rot .9s linear infinite}

.ss-switch{text-align:center; color:var(--mute); font-size:14.5px; margin-top:24px}
.ss-switch a{color:var(--blue); font-weight:600; text-decoration:none}
.ss-switch a:hover{text-decoration:underline}

.ss-done{text-align:center; padding:40px 0; animation:ss-pop .5s cubic-bezier(.2,1.2,.4,1)}
.ss-done h2{font-family:'Bricolage Grotesque',sans-serif; margin:16px 0 6px; font-size:28px}
.ss-done p{color:var(--mute); margin:0}

/* ---------- Keyframes ---------- */
@keyframes ss-ladder{0%,100%{transform:scaleY(.55)}50%{transform:scaleY(1)}}
@keyframes ss-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes ss-draw{0%{stroke-dashoffset:1}60%,85%{stroke-dashoffset:0}100%{stroke-dashoffset:-1}}
@keyframes ss-drift{to{transform:translate(-60px,50px)}}
@keyframes ss-rot{to{transform:rotate(360deg)}}
@keyframes ss-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
@keyframes ss-pop{from{opacity:0; transform:scale(.92)}to{opacity:1; transform:scale(1)}}

/* ---------- Responsive + motion ---------- */
@media (max-width:900px){
  .ss-root{grid-template-columns:1fr}
  .ss-side{display:none}
  .ss-mobile-brand{display:flex}
}
@media (prefers-reduced-motion:reduce){
  .ss-root *{animation:none !important; transition:none !important}
  .ss-wave-line{stroke-dashoffset:0}
}
`;