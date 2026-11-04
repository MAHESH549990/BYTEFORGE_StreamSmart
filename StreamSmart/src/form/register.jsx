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
.ss-root{--paper:#f1f0ed;--white:#fff;--ink:#171717;--muted:#777773;--line:#e4e2dd;--yellow:#e9f500;--gold:#9a7400;--gradient:linear-gradient(100deg,#d928db 0%,#ff5147 54%,#ffbd00 100%);min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);font-family:"DM Sans",Arial,sans-serif;color:var(--ink);background:var(--white)}
.ss-root *{box-sizing:border-box}
.ss-side{position:relative;display:flex;flex-direction:column;justify-content:space-between;min-height:100vh;padding:42px clamp(28px,6vw,86px);overflow:hidden;background:var(--paper);border-right:1px solid var(--line)}
.ss-glow{display:none}
.ss-brand{position:relative;display:flex;align-items:center;gap:11px;font-size:20px;font-weight:750;letter-spacing:-.5px}
.ss-brand .ss-logo rect:first-child,.ss-mobile-brand .ss-logo rect:first-child{fill:var(--yellow);stroke:#d5dc00}
.ss-brand .ss-logo-play,.ss-mobile-brand .ss-logo-play{fill:var(--ink)}
.ss-brand .ss-bar,.ss-mobile-brand .ss-bar{fill:var(--gold)}
.ss-hero{position:relative;max-width:490px}
.ss-hero h1{margin:0 0 15px;font-size:clamp(34px,4vw,54px);font-weight:750;line-height:1.05;letter-spacing:-2px;color:var(--ink)}
.ss-hero p{max-width:44ch;margin:0 0 28px;color:#62615c;font-size:15px;line-height:1.75}
.ss-foot{position:relative;color:#777773;font-size:12px}
.ss-wave{width:100%;height:80px;display:block;overflow:visible}
.ss-guide{stroke:#d8d6cf;stroke-dasharray:3 6;stroke-width:1}
.ss-wave-line{fill:none;stroke:#ab8500;stroke-width:3;stroke-linecap:round;filter:none;animation:none;stroke-dashoffset:0}
.ss-wave-legend{display:flex;justify-content:space-between;margin:7px 0 24px;color:#777773;font-size:11px}
.ss-wave-legend i{display:inline-block;width:7px;height:7px;margin:0 5px 0 10px;border-radius:50%}
.ss-strip{padding:15px 16px;background:#fff;border:1px solid var(--line);border-radius:7px}
.ss-strip-head{display:flex;justify-content:space-between;margin-bottom:12px;color:#777773;font-size:12px}
.ss-now{font-weight:700}
.ss-segs{display:flex;align-items:flex-end;gap:4px;height:30px}
.ss-seg{flex:1;border-radius:2px;background:#deddd7;opacity:.7;transition:background .2s}
.ss-seg.on{background:var(--c);opacity:1;transform:none}
.ss-bar{animation:none!important}.ss-logo-play{animation:none!important}
.ss-main{display:flex;align-items:center;justify-content:center;min-width:0;padding:42px clamp(22px,5vw,70px);background:#fff}
.ss-card{width:100%;max-width:420px}
.ss-mobile-brand{display:none;align-items:center;gap:9px;margin-bottom:26px;font-size:18px;font-weight:750}
.ss-title{margin:0 0 7px;color:var(--ink);font-size:30px;font-weight:750;letter-spacing:-1px}
.ss-sub{margin:0 0 27px;color:var(--muted);font-size:14px;line-height:1.6}
.ss-field{display:block;margin-bottom:16px}
.ss-field>span{display:block;margin-bottom:7px;color:#393833;font-size:12px;font-weight:650}
.ss-input{height:46px;display:flex;align-items:center;gap:10px;padding:0 12px;border:1px solid #deddd7;border-radius:5px;background:#fff;color:#85847e;transition:border-color .15s,box-shadow .15s}
.ss-input:focus-within{border-color:#b79c25;box-shadow:0 0 0 3px rgba(183,156,37,.12);color:#806200}
.ss-input.bad{border-color:#d86a5d}
.ss-input input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--ink);font:inherit;font-size:13px}
.ss-input input::placeholder{color:#aaa9a3}
.ss-eye{display:grid;place-items:center;padding:4px;border:0;border-radius:5px;background:transparent;color:#777773;cursor:pointer}
.ss-eye:hover{background:#f5f3e8;color:#171717}.ss-eye:focus-visible{outline:2px solid #b79c25}
.ss-meter{min-height:18px;display:flex;align-items:flex-end;gap:10px;margin-top:9px}
.ss-meter-bars{display:flex;align-items:flex-end;gap:4px}.ss-meter-bars span{width:7px;border-radius:2px;background:#deddd7}.ss-meter-bars span.on{background:var(--c)}
.ss-meter small,.ss-warn{color:#777773;font-size:11px}.ss-warn{display:block;margin-top:6px;color:#a33c2c}
.ss-error{display:flex;align-items:center;gap:8px;padding:10px 12px;margin-bottom:15px;border:1px solid #f0c9c2;border-radius:5px;background:#fff7f5;color:#a33c2c;font-size:12px}
.ss-submit{width:100%;height:46px;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;border:0;border-radius:5px;background:var(--gradient);color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.ss-submit:hover:not(:disabled){filter:saturate(1.06)}.ss-submit:active:not(:disabled){filter:brightness(.96)}.ss-submit:disabled{opacity:.65;cursor:progress}.ss-submit:focus-visible{outline:2px solid #b79c25;outline-offset:3px}
.ss-spin{animation:ss-rot .9s linear infinite}
.ss-switch{margin-top:21px;color:var(--muted);font-size:13px;text-align:center}.ss-switch a{color:#8a6900;font-weight:700;text-decoration:none}.ss-switch a:hover{text-decoration:underline}
.ss-done{padding:36px 0;text-align:center}.ss-done h2{margin:14px 0 6px;font-size:25px;color:var(--ink)}.ss-done p{margin:0;color:var(--muted)}
@keyframes ss-rot{to{transform:rotate(360deg)}}
@media(max-width:900px){.ss-root{grid-template-columns:1fr}.ss-side{display:none}.ss-mobile-brand{display:flex}}
@media(max-width:520px){.ss-main{padding:28px 20px}.ss-title{font-size:26px}}
@media(prefers-reduced-motion:reduce){.ss-root *{animation:none!important;transition:none!important}}
`;
