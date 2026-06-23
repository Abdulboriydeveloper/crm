import { useState } from 'react'

const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

export default function SettingsModal({ currentUrl, onSave, onClose }) {
  const [url, setUrl] = useState(currentUrl || '')
  const [err, setErr] = useState('')

  const handleSave = () => {
    if (!url.trim()) { setErr('URL kiritish shart'); return }
    if (!url.includes('script.google.com')) { setErr("To'g'ri Apps Script URL kiriting"); return }
    onSave(url.trim())
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100,
      background:'rgba(0,0,0,0.5)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16
    }}>
      <div style={{
        background:'var(--surface)', borderRadius:16,
        padding:24, width:'100%', maxWidth:480,
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:16, fontWeight:600 }}>⚙️ Apps Script URL</h2>
          {onClose && (
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'var(--text2)', cursor:'pointer' }}>×</button>
          )}
        </div>

        {/* Lokal dev da URL kiritish */}
        {IS_DEV && (
          <>
            <div style={{
              background:'#EFF6FF', border:'1px solid #BFDBFE',
              borderRadius:10, padding:12, marginBottom:16, fontSize:12, color:'#1E40AF'
            }}>
              🖥️ <strong>Lokal test rejimi</strong> — Apps Script URL ni to'g'ridan kiriting
            </div>
            <label style={{ fontSize:12, fontWeight:500, color:'var(--text2)', display:'block', marginBottom:6 }}>
              Google Apps Script Web App URL
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={e => { setUrl(e.target.value); setErr('') }}
              style={{
                width:'100%', padding:'9px 12px',
                border:`1px solid ${err ? '#EF4444' : 'var(--border)'}`,
                borderRadius:8, background:'var(--surface2)',
                color:'var(--text)', fontSize:13, outline:'none',
                marginBottom: err ? 4 : 16
              }}
            />
            {err && <div style={{ color:'#EF4444', fontSize:12, marginBottom:12 }}>{err}</div>}
            <button onClick={handleSave} style={{
              width:'100%', padding:'10px', background:'#7C3AED', color:'#fff',
              border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:16
            }}>Saqlash</button>
            <hr style={{ border:'none', borderTop:'1px solid var(--border)', marginBottom:16 }}/>
          </>
        )}

        {/* Vercel deploy ko'rsatmasi */}
        <div style={{
          background:'var(--surface2)', border:'1px solid var(--border)',
          borderRadius:10, padding:14, fontSize:13, color:'var(--text2)', lineHeight:1.8
        }}>
          <div style={{ fontWeight:600, color:'var(--text)', marginBottom:8 }}>
            🚀 Vercel ga deploy qilganda:
          </div>
          <div>Vercel → Settings → Environment Variables:</div>
          <code style={{
            display:'block', marginTop:6, padding:'8px 12px',
            background:'var(--surface)', borderRadius:8,
            fontSize:12, color:'#7C3AED', border:'1px solid var(--border)',
            wordBreak:'break-all'
          }}>
            APPS_SCRIPT_URL = https://script.google.com/macros/s/...../exec
          </code>
          <div style={{ marginTop:10, fontSize:12 }}>
            Keyin <strong>Redeploy</strong> qiling — URL kiritish shart emas.
          </div>
        </div>

        {!IS_DEV && onClose && (
          <button onClick={onClose} style={{
            width:'100%', marginTop:16, padding:'10px',
            background:'#7C3AED', color:'#fff',
            border:'none', borderRadius:10,
            fontSize:14, fontWeight:600, cursor:'pointer'
          }}>Yopish</button>
        )}
      </div>
    </div>
  )
}
