import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, UserRound, ArrowRight, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const result = window.easyGauge ? await window.easyGauge.login({ username, password }) : { ok: username === 'admin' && password === 'admin123', user: { id: 1, username, displayName: 'Gauge Operator' } };
      if (result.ok) onLogin(result.user); else setError(result.error || 'Unable to sign in.');
    } catch { setError('Unable to connect to the local database.'); }
    finally { setLoading(false); }
  }

  return <main className="login-page">
    <section className="login-visual">
      <div className="visual-grid" />
      <div className="visual-content">
        <Logo light />
        <div className="visual-message">
          <span className="eyebrow"><ShieldCheck size={16}/> PRECISION VISION SYSTEM</span>
          <h1>Measure with<br/><em>absolute clarity.</em></h1>
          <p>Accurate, non-contact visual inspection made effortless for the modern production floor.</p>
        </div>
        <div className="visual-metric"><b>± 0.01 mm</b><span>Repeatable accuracy</span></div>
      </div>
    </section>
    <section className="login-panel">
      <div className="login-box">
        <Logo />
        <div className="login-heading"><h2>Welcome back</h2><p>Sign in to continue to your workspace</p></div>
        <form onSubmit={submit}>
          <label>Username<div className="field"><UserRound size={19}/><input autoFocus value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter username" required/></div></label>
          <label>Password<div className="field"><LockKeyhole size={19}/><input value={password} onChange={e=>setPassword(e.target.value)} type={show?'text':'password'} placeholder="Enter password" required/><button className="eye" type="button" onClick={()=>setShow(!show)}>{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>
          {error && <div className="form-error">{error}</div>}
          <button className="login-button" disabled={loading}>{loading?'Signing in…':<>Sign in <ArrowRight size={19}/></>}</button>
        </form>
        <p className="demo-note">Demo access: <b>admin</b> / <b>admin123</b></p>
      </div>
      <footer>eSya Easy Gauge v1.0 · Secure local access</footer>
    </section>
  </main>;
}
