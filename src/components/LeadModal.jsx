import { useState, useEffect } from 'react'
import { STAGES } from './Board.jsx'
import { getNotes, addNote } from '../supabase.js'

const COLORS = [['#EDE9FE','#7C3AED'],['#DBEAFE','#2563EB'],['#DCFCE7','#16A34A'],['#FEF3C7','#D97706'],['#FCE7F3','#DB2777'],['#D1FAE5','#059669']]

function initials(name) {
  return (name||'?').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?'
}

function timeAgo(iso) {
  const d = new Date(iso), now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'Hozirgina'
  if (diff < 3600) return Math.floor(diff/60) + ' daqiqa oldin'
  if (diff < 86400) return Math.floor(diff/3600) + ' soat oldin'
  return d.toLocaleDateString('uz-UZ')
}

export default function LeadModal({ lead, user, onClose, onMove, onAssign, managers }) {
  const [notes, setNotes] = useState([])
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [movingTo, setMovingTo] = useState(null)
  const [tab, setTab] = useState('info') // 'info' | 'notes'

  const ci = Math.abs((lead.name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % COLORS.length
  const [avatarBg, avatarFg] = COLORS[ci]
  const currentStage = STAGES.find(s => s.label === lead.stage)

  useEffect(() => {
    getNotes(lead.id).then(setNotes).catch(console.error)
  }, [lead.id])

  const handleMove = async (stage) => {
    if (stage === lead.stage) return
    setMovingTo(stage)
    await onMove(lead.id, stage)
    setMovingTo(null)
  }

  const handleNote = async () => {
    if (!noteText.trim()) return
    setAddingNote(true)
    try {
      const note = await addNote(lead.id, noteText.trim(), user.name)
      setNotes(prev => [...prev, note])
      setNoteText('')
    } catch(e) { console.error(e) }
    setAddingNote(false)
  }

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.55)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16
    }}>
      <div style={{
        background:'var(--surface)', borderRadius:18, width:'100%', maxWidth:460,
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)', display:'flex', flexDirection:'column',
        maxHeight:'90vh', overflow:'hidden'
      }}>
        {/* Header */}
        <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:avatarBg, color:avatarFg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0 }}>
                {initials(lead.name)}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700 }}>{lead.name||'—'}</div>
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} style={{ fontSize:13, color:'#7C3AED', textDecoration:'none' }}>📞 {lead.phone}</a>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'var(--text2)', cursor:'pointer', lineHeight:1, padding:2 }}>×</button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginTop:14 }}>
            {['info', 'notes'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'5px 16px', borderRadius:8, fontSize:12, cursor:'pointer',
                border: tab===t ? '1.5px solid #7C3AED' : '1px solid var(--border)',
                background: tab===t ? '#EDE9FE' : 'var(--surface2)',
                color: tab===t ? '#7C3AED' : 'var(--text2)', fontWeight: tab===t ? 700 : 400
              }}>
                {t==='info' ? '📋 Ma\'lumot' : `💬 Izohlar (${notes.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflow:'auto', padding:'16px 20px' }}>

          {tab === 'info' && (
            <div>
              {/* Current stage */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8, fontWeight:600 }}>Joriy bosqich</div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:currentStage?.bg||'var(--surface2)', border:`1px solid ${currentStage?.border||'var(--border)'}33`, color:currentStage?.border||'var(--text)', fontSize:13, fontWeight:700 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:currentStage?.border||'var(--text2)' }}/>
                  {lead.stage}
                </div>
              </div>

              {/* Move stage */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8, fontWeight:600 }}>Bosqichni o'zgartirish</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {STAGES.map(s => (
                    <button key={s.key} onClick={() => handleMove(s.label)} disabled={!!movingTo} style={{
                      padding:'4px 11px', borderRadius:20, fontSize:11, cursor:'pointer',
                      border: `1px solid ${s.label===lead.stage ? s.border : 'var(--border)'}`,
                      background: s.label===lead.stage ? s.bg : 'transparent',
                      color: s.label===lead.stage ? s.border : 'var(--text2)',
                      fontWeight: s.label===lead.stage ? 700 : 400,
                      opacity: movingTo && movingTo!==s.label ? 0.5 : 1
                    }}>
                      {movingTo===s.label ? '...' : s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign (admin only) */}
              {user.role === 'admin' && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8, fontWeight:600 }}>Menejerga berish</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {managers.map(m => (
                      <button key={m.id} onClick={() => onAssign(lead.id, m.id)} style={{
                        padding:'5px 14px', borderRadius:20, fontSize:12, cursor:'pointer',
                        border: `1.5px solid ${lead.assigned_to===m.id ? m.color : 'var(--border)'}`,
                        background: lead.assigned_to===m.id ? m.color+'18' : 'var(--surface2)',
                        color: lead.assigned_to===m.id ? m.color : 'var(--text2)',
                        fontWeight: lead.assigned_to===m.id ? 700 : 400,
                        display:'flex', alignItems:'center', gap:6
                      }}>
                        <div style={{ width:18, height:18, borderRadius:'50%', background:m.color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700 }}>{m.initials}</div>
                        {m.name}
                        {lead.assigned_to===m.id && ' ✓'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {lead.phone && (
                <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'10px', background:'#25D366', color:'#fff',
                  borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:700
                }}>💬 WhatsApp da yozish</a>
              )}

              <div style={{ marginTop:12, fontSize:11, color:'var(--text3)', textAlign:'center' }}>
                Qo'shilgan: {new Date(lead.created_at).toLocaleDateString('uz-UZ')}
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div>
              {/* Notes list */}
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                {notes.length === 0 && (
                  <div style={{ textAlign:'center', color:'var(--text3)', fontSize:13, padding:'24px 0' }}>
                    Hali izoh yo'q. Birinchi bo'lib yozing!
                  </div>
                )}
                {notes.map(note => {
                  const isMe = note.author === user.name
                  return (
                    <div key={note.id} style={{
                      padding:'10px 12px', borderRadius:10,
                      background: isMe ? '#EDE9FE' : 'var(--surface2)',
                      border: `1px solid ${isMe ? '#C4B5FD' : 'var(--border)'}`,
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth:'85%'
                    }}>
                      <div style={{ fontSize:11, fontWeight:700, color: isMe ? '#7C3AED' : 'var(--text2)', marginBottom:4 }}>
                        {note.author} · {timeAgo(note.created_at)}
                      </div>
                      <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{note.text}</div>
                    </div>
                  )
                })}
              </div>

              {/* Note input */}
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:12 }}>
                <textarea
                  placeholder="Izoh yozing..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter' && e.metaKey) handleNote() }}
                  rows={3}
                  style={{
                    width:'100%', padding:'10px 12px', resize:'none',
                    border:'1.5px solid var(--border)', borderRadius:10,
                    background:'var(--surface2)', color:'var(--text)', fontSize:13,
                    outline:'none', boxSizing:'border-box', fontFamily:'inherit'
                  }}
                />
                <button onClick={handleNote} disabled={!noteText.trim() || addingNote} style={{
                  marginTop:8, width:'100%', padding:'9px',
                  background: !noteText.trim() ? 'var(--border2)' : '#7C3AED',
                  color: !noteText.trim() ? 'var(--text3)' : '#fff',
                  border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer'
                }}>
                  {addingNote ? 'Saqlanmoqda...' : 'Yuborish (⌘+Enter)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
