import { useState } from 'react'
import { STAGES } from './Board.jsx'

export default function AddLeadModal({ onClose, onAdd, currentUser }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [stage, setStage] = useState('Yangi lid')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (!name.trim()) { setError("Ism kiritish shart"); return }
    if (!phone.trim()) { setError("Telefon raqam kiritish shart"); return }
    setError('')
    setLoading(true)
    try {
      await onAdd({ name: name.trim(), phone: phone.trim(), stage })
      onClose()
    } catch(e) {
      setError('Xato: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.5)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16
    }}>
      <div style={{
        background:'var(--surface)', borderRadius:16, padding:24,
        width:'100%', maxWidth:420,
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:700 }}>➕ Yangi lid qo'shish</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'var(--text2)', cursor:'pointer' }}>×</button>
        </div>

        {/* Ism */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
            Ism familiya *
          </label>
          <input
            type="text"
            placeholder="Masalan: Aziza Karimova"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{
              width:'100%', padding:'10px 12px',
              border:`1.5px solid ${error&&!name ? '#EF4444' : 'var(--border)'}`,
              borderRadius:10, background:'var(--surface2)',
              color:'var(--text)', fontSize:14, outline:'none',
              fontFamily:'inherit', boxSizing:'border-box'
            }}
          />
        </div>

        {/* Telefon */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
            Telefon raqam *
          </label>
          <input
            type="tel"
            placeholder="+998901234567"
            value={phone}
            onChange={e => { setPhone(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{
              width:'100%', padding:'10px 12px',
              border:`1.5px solid ${error&&!phone ? '#EF4444' : 'var(--border)'}`,
              borderRadius:10, background:'var(--surface2)',
              color:'var(--text)', fontSize:14, outline:'none',
              fontFamily:'inherit', boxSizing:'border-box'
            }}
          />
        </div>

        {/* Bosqich */}
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>
            Bosqich
          </label>
          <select
            value={stage}
            onChange={e => setStage(e.target.value)}
            style={{
              width:'100%', padding:'10px 12px', fontSize:13,
              border:'1.5px solid var(--border)', borderRadius:10,
              background:'var(--surface2)', color:'var(--text)',
              cursor:'pointer', outline:'none', fontFamily:'inherit'
            }}
          >
            {STAGES.map(s => <option key={s.key} value={s.label}>{s.label}</option>)}
          </select>
        </div>

        {/* Xato */}
        {error && (
          <div style={{
            color:'#DC2626', fontSize:13, marginBottom:14,
            background:'#FEE2E2', padding:'8px 12px', borderRadius:8
          }}>⚠️ {error}</div>
        )}

        {/* Tugmalar */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{
            flex:1, padding:'10px', borderRadius:10,
            border:'1px solid var(--border)', background:'var(--surface2)',
            color:'var(--text2)', fontSize:14, cursor:'pointer'
          }}>Bekor qilish</button>
          <button onClick={handleAdd} disabled={loading || !name.trim() || !phone.trim()} style={{
            flex:2, padding:'10px', borderRadius:10, border:'none',
            background: !name.trim()||!phone.trim() ? 'var(--border2)' : '#7C3AED',
            color: !name.trim()||!phone.trim() ? 'var(--text3)' : '#fff',
            fontSize:14, fontWeight:700, cursor: loading ? 'wait' : 'pointer'
          }}>
            {loading ? 'Qo\'shilmoqda...' : '➕ Qo\'shish'}
          </button>
        </div>
      </div>
    </div>
  )
}