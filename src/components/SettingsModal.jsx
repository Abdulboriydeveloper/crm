import { useState } from 'react'

export default function SettingsModal({ currentUrl, onSave, onClose }) {
  const [url, setUrl] = useState(currentUrl || '')
  const [err, setErr] = useState('')

  const handleSave = () => {
    const v = url.trim()
    if (!v) { setErr('URL kiritish shart'); return }
    if (!v.includes('script.google.com')) { setErr("To'g'ri Apps Script URL kiriting"); return }
    onSave(v)
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100,
      background:'rgba(0,0,0,0.6)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16
    }}>
      <div style={{
        background:'var(--surface)', borderRadius:16,
        padding:24, width:'100%', maxWidth:460,
        boxShadow:'0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700 }}>⚙️ Apps Script URL</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>Google Sheets bilan ulanish uchun</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'var(--text2)', cursor:'pointer' }}>×</button>
          )}
        </div>

        {/* Qanday olish */}
        <div style={{
          background:'var(--surface2)', border:'1px solid var(--border)',
          borderRadius:10, padding:13, marginBottom:16, fontSize:12,
          color:'var(--text2)', lineHeight:1.8
        }}>
          <div style={{ fontWeight:600, color:'var(--text)', marginBottom:6 }}>URL ni qayerdan olish:</div>
          <div>1. <a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color:'#7C3AED' }}>script.google.com</a> → loyihangizni oching</div>
          <div>2. <strong style={{ color:'var(--text)' }}>Deploy → Manage deployments</strong></div>
          <div>3. URL ni nusxalang → shu yerga joylashtiring</div>
        </div>

        {/* Input */}
        <div style={{ marginBottom: err ? 6 : 14 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
            Web App URL
          </label>
          <input
            type="url"
            placeholder="https://script.google.com/macros/s/xxxxx/exec"
            value={url}
            onChange={e => { setUrl(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            style={{
              width:'100%', padding:'10px 12px',
              border:`1.5px solid ${err ? '#EF4444' : url && url.includes('script.google.com') ? '#16A34A' : 'var(--border)'}`,
              borderRadius:8, background:'var(--surface2)',
              color:'var(--text)', fontSize:13, outline:'none',
              transition:'border-color .15s'
            }}
          />
        </div>
        {err && <div style={{ color:'#EF4444', fontSize:12, marginBottom:12 }}>{err}</div>}

        <button
          onClick={handleSave}
          style={{
            width:'100%', padding:'11px',
            background:'#7C3AED', color:'#fff',
            border:'none', borderRadius:10,
            fontSize:14, fontWeight:700, cursor:'pointer',
            transition:'opacity .15s'
          }}
          onMouseEnter={e => e.target.style.opacity = '0.9'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          Saqlash va ulanish
        </button>
      </div>
    </div>
  )
}
