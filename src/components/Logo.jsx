export default function Logo({ light = false, compact = false }) {
  return <div className={`brand ${light ? 'brand-light' : ''} ${compact ? 'brand-compact' : ''}`} aria-label="eSya Easy Gauge">
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <defs><linearGradient id="g" x1="8" y1="10" x2="54" y2="55" gradientUnits="userSpaceOnUse"><stop stopColor="#13b8ab"/><stop offset="1" stopColor="#00727c"/></linearGradient></defs>
      <path fill="url(#g)" d="M32 3 57 17.5v29L32 61 7 46.5v-29L32 3Z"/>
      <path fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" d="M44 22.5H26.5a10 10 0 0 0 0 20H44M22 32.5h18"/>
      <circle cx="45" cy="32.5" r="4" fill="#ffb547"/>
    </svg>
    <div className="brand-copy"><div><b>eSya</b><span>®</span></div>{!compact && <small>EASY GAUGE</small>}</div>
  </div>;
}
