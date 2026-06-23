import { useState } from 'react'
import { STAGES } from './Board.jsx'

function parseCard(val) {
  const lines = (val || '').split('\n')
  let name = '', phone = ''
  for (const l of lines) {
    if (l.startsWith('Ism:')) name = l.replace('Ism:', '').trim()
    else if (l.startsWith('Raqam:')) phone = l.replace('Raqam:', '').trim()
  }
  if (!name && !phone) { name = val; phone = '' }
  return { name, phone }
}

export default function LeadModal({ lead, onClose, onMove }) {
  const { name, phone } = parseCard(lead.value)
  const [stage, setStage] = useState(lead.stage)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentStage = STAGES.find(s => s.label === stage)

  const handleMove = async (newStage) => {
    if (newStage === stage) return
    setSaving(true)
    await onMove(phone || lead.value, newStage)
    setStage(newStage)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:'fixed', inset:0, zIndex:200,
        background:'rgba(0,0,0,0.5)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:16
      }}
    >
      <div style={{
        background:'var(--surface)', borderRadius:16,
        padding:24, width:'100%', maxWidth:400,
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h3 style={{ fontSize:15, fontWeight:600 }}>Lid ma'lumotlari</h3>
          <button onClick={onClose} style={{
            background:'none', border:'none', fontSize:22,
            color:'var(--text2)', cursor:'pointer', lineHeight:1
          }}>×</button>
        </div>

        {/* Info card */}
        <div style={{
          background:'var(--surface2)', borderRadius:12,
          padding:'14px 16px', marginBottom:18
        }}>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:5 }}>{name || '—'}</div>
          {phone && (
            <a href={`tel:${phone}`} style={{ fontSize:14, color:'var(--accent)', textDecoration:'none' }}>
              📞 {phone}
            </a>
          )}
        </div>

        {/* Current stage */}
        <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>Joriy bosqich:</div>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'5px 12px', borderRadius:20,
          background: currentStage?.bg || 'var(--surface2)',
          color: currentStage?.border || 'var(--text)',
          fontSize:12, fontWeight:700, marginBottom:14,
          border:`1px solid ${currentStage?.border || 'var(--border)'}33`
        }}>
          <span style={{
            width:6, height:6, borderRadius:'50%',
            background: currentStage?.border || 'var(--text2)'
          }}/>
          {stage}
          {saving && ' ...'}
        </div>

        {/* Stage buttons */}
        <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>Bosqichni o'zgartirish:</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
          {STAGES.map(s => (
            <button key={s.key} onClick={() => handleMove(s.label)} disabled={saving} style={{
              padding:'5px 11px', borderRadius:20, fontSize:11, cursor:'pointer',
              border:`1px solid ${s.label === stage ? s.border : 'var(--border)'}`,
              background: s.label === stage ? s.bg : 'transparent',
              color: s.label === stage ? s.border : 'var(--text2)',
              fontWeight: s.label === stage ? 700 : 400,
              transition:'all .12s'
            }}>{s.label}</button>
          ))}
        </div>

        {saved && (
          <div style={{
            textAlign:'center', color:'#059669', fontSize:13,
            padding:'7px', background:'#D1FAE5', borderRadius:8, marginBottom:12
          }}>✅ Saqlandi!</div>
        )}

        {phone && (
          <a
            href={`https://wa.me/${phone.replace(/[^0-9]/g,'')}`}
            target="_blank" rel="noreferrer"
            style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              gap:8, padding:'10px',
              background:'#25D366', color:'#fff',
              borderRadius:10, textDecoration:'none',
              fontSize:13, fontWeight:600
            }}
          >💬 WhatsApp da yozish</a>
        )}
      </div>
    </div>
  )
}
