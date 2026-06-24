import { useState, useEffect, useRef } from 'react'
import { STAGES } from './Board.jsx'
import { getNotes, addNote, supabase } from '../supabase.js'

const COLORS = [['#EDE9FE','#7C3AED'],['#DBEAFE','#2563EB'],['#DCFCE7','#16A34A'],['#FEF3C7','#D97706'],['#FCE7F3','#DB2777'],['#D1FAE5','#059669']]

function initials(name) {
  return (name||'?').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?'
}

function timeStr(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('uz-UZ', { hour:'2-digit', minute:'2-digit' }) + ' ' +
    d.toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit' })
}

export default function LeadModal({ lead, user, onClose, onMove, onAssign, managers }) {
  const [notes, setNotes] = useState([])
  const [messages, setMessages] = useState([])
  const [noteText, setNoteText] = useState('')
  const [chatText, setChatText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [sendingMsg, setSendingMsg] = useState(false)
  const [amount, setAmount] = useState(lead.amount || '')
  const [infoStage, setInfoStage] = useState(lead.stage)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const msgEndRef = useRef(null)
  const noteEndRef = useRef(null)

  const infoChanged = String(amount) !== String(lead.amount || '') || infoStage !== lead.stage

  const ci = Math.abs((lead.name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % COLORS.length
  const [avatarBg, avatarFg] = COLORS[ci]
  const currentStage = STAGES.find(s => s.label === lead.stage)

  const loadMessages = async () => {
    if (!lead.id) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  useEffect(() => {
    getNotes(lead.id).then(setNotes).catch(console.error)
    loadMessages()
    const sub = supabase
      .channel(`messages-${lead.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `lead_id=eq.${lead.id}`
      }, payload => setMessages(prev => [...prev, payload.new]))
      .subscribe()
    return () => sub.unsubscribe()
  }, [lead.id])

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { noteEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [notes])

  const saveInfo = async () => {
    setSaving(true)
    try {
      await supabase.from('leads').update({
        amount: Number(amount) || 0,
        stage: infoStage
      }).eq('id', lead.id)
      if (infoStage !== lead.stage) await onMove(lead.id, infoStage)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch(e) { console.error(e) }
    setSaving(false)
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

  const handleSendChat = async () => {
    if (!chatText.trim() || !lead.chat_id) return
    setSendingMsg(true)
    const textToSend = chatText.trim()
    setChatText('')
    try {
      const { data: savedMsg } = await supabase.from('messages').insert([{
        lead_id: lead.id,
        chat_id: lead.chat_id,
        text: textToSend,
        from_bot: true,
        msg_type: 'text'
      }]).select().single()
      if (savedMsg) setMessages(prev => [...prev, savedMsg])
      const BOT_URL = import.meta.env.VITE_BOT_URL
      if (BOT_URL) {
        await fetch(`${BOT_URL}/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: lead.chat_id, text: textToSend, lead_id: lead.id })
        })
      }
    } catch(e) { console.error(e) }
    setSendingMsg(false)
  }

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.55)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16
    }}>
      <div style={{
        background:'var(--surface)', borderRadius:18, width:'100%', maxWidth:960,
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)', display:'flex', flexDirection:'column',
        height:'88vh', overflow:'hidden'
      }}>

        {/* Header */}
        <div style={{ padding:'16px 20px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:avatarBg, color:avatarFg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0 }}>
                {initials(lead.name)}
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:700 }}>{lead.name||'—'}</div>
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} style={{ fontSize:13, color:'#7C3AED', textDecoration:'none' }}>
                    📞 {lead.phone}
                  </a>
                )}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20, background:currentStage?.bg||'var(--surface2)', color:currentStage?.border||'var(--text2)', border:`1px solid ${currentStage?.border||'var(--border)'}44` }}>
                {lead.stage}
              </div>
              {lead.amount > 0 && (
                <div style={{ fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20, background:'#D1FAE5', color:'#059669' }}>
                  💰 {Number(lead.amount).toLocaleString('uz-UZ')} so'm
                </div>
              )}
              <button onClick={onClose} style={{ background:'none', border:'none', fontSize:24, color:'var(--text2)', cursor:'pointer', lineHeight:1, padding:'0 4px' }}>×</button>
            </div>
          </div>
        </div>

        {/* Body - ikki ustunli */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'row' }}>

          {/* CHAP: CHAT */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', borderRight:'1px solid var(--border)', overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>
                💬 Chat {messages.length > 0 && `(${messages.length})`}
              </span>
            </div>

            {/* Xabarlar */}
            <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
              {!lead.chat_id && (
                <div style={{ textAlign:'center', color:'var(--text3)', fontSize:12, padding:'20px 0' }}>
                  Bu lid bot orqali ro'yxatdan o'tmagan
                </div>
              )}
              {messages.length === 0 && lead.chat_id && (
                <div style={{ textAlign:'center', color:'var(--text3)', fontSize:12, padding:'20px 0' }}>
                  Hali xabarlar yo'q
                </div>
              )}
              {messages.map(msg => {
                const isBot = msg.from_bot
                return (
                  <div key={msg.id} style={{ display:'flex', justifyContent: isBot ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth:'40%', padding:'8px 12px',
                      borderRadius: isBot ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isBot ? '#7C3AED' : 'var(--surface2)',
                      color: isBot ? '#fff' : 'var(--text)',
                      border: isBot ? 'none' : '1px solid var(--border)'
                    }}>
                      {!isBot && <div style={{ fontSize:10, fontWeight:700, color:'#7C3AED', marginBottom:3 }}>{lead.name}</div>}
                      {msg.msg_type === 'photo' && msg.text && msg.text.startsWith('http') ? (
                        <img src={msg.text} alt="rasm" style={{ maxWidth:'100%', borderRadius:8, display:'block', marginBottom:4 }} />
                      ) : msg.msg_type === 'photo' ? (
                        <div style={{ fontSize:13 }}>📸 Rasm yubordi</div>
                      ) : (
                        <div style={{ fontSize:13, lineHeight:1.5, whiteSpace:'pre-wrap' }}>{msg.text}</div>
                      )}
                      <div style={{ fontSize:10, opacity:0.7, marginTop:3, textAlign:'right' }}>{timeStr(msg.created_at)}</div>
                    </div>
                  </div>
                )
              })}
              <div ref={msgEndRef}/>
            </div>

            {/* Chat input */}
            {lead.chat_id && (
              <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:8, flexShrink:0 }}>
                <input
                  type="text"
                  placeholder="Xabar yozing..."
                  value={chatText}
                  onChange={e => setChatText(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && !e.shiftKey && handleSendChat()}
                  style={{
                    flex:1, padding:'9px 12px', border:'1.5px solid var(--border)',
                    borderRadius:10, background:'var(--surface2)', color:'var(--text)',
                    fontSize:13, outline:'none', fontFamily:'inherit'
                  }}
                />
                <button onClick={handleSendChat} disabled={!chatText.trim()||sendingMsg} style={{
                  padding:'9px 16px', background:!chatText.trim()?'var(--border2)':'#7C3AED',
                  color:!chatText.trim()?'var(--text3)':'#fff',
                  border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0
                }}>{sendingMsg ? '...' : '➤'}</button>
              </div>
            )}
          </div>

          {/* O'NG: MA'LUMOT */}
          <div style={{ width:320, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>📋 Ma'lumot</span>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:14 }}>

              {/* Bosqich */}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>Bosqich</label>
                <select value={infoStage} onChange={e => setInfoStage(e.target.value)} style={{
                  width:'100%', padding:'8px 12px', fontSize:13,
                  border:'1.5px solid var(--border)', borderRadius:10,
                  background:'var(--surface2)', color:'#000000',
                  cursor:'pointer', outline:'none', fontFamily:'inherit'
                }}>
                  {STAGES.map(s => <option key={s.key} value={s.label}>{s.label}</option>)}
                </select>
              </div>

              {/* Menejerga berish (admin only) */}
              {user.role === 'admin' && (
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>Menejerga berish</label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {managers.map(m => (
                      <button key={m.id} onClick={() => onAssign(lead.id, m.id)} style={{
                        padding:'5px 12px', borderRadius:20, fontSize:12, cursor:'pointer',
                        border:`1.5px solid ${lead.assigned_to===m.id ? m.color : 'var(--border)'}`,
                        background: lead.assigned_to===m.id ? m.color+'18' : 'var(--surface2)',
                        color: lead.assigned_to===m.id ? m.color : 'var(--text2)',
                        fontWeight: lead.assigned_to===m.id ? 700 : 400,
                        display:'flex', alignItems:'center', gap:5
                      }}>
                        <div style={{ width:16, height:16, borderRadius:'50%', background:m.color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700 }}>{m.initials}</div>
                        {m.name}{lead.assigned_to===m.id && ' ✓'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Summa */}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>💰 Summa (so'm)</label>
                <input
                  type="number" placeholder="0" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{
                    width:'100%', padding:'8px 12px',
                    border:'1.5px solid var(--border)', borderRadius:10,
                    background:'var(--surface2)', color:'var(--text)',
                    fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box'
                  }}
                />
                {amount > 0 && (
                  <div style={{ fontSize:11, color:'#059669', marginTop:4, fontWeight:600 }}>
                    = {Number(amount).toLocaleString('uz-UZ')} so'm
                  </div>
                )}
              </div>

              {/* Saqlash — faqat o'zgarish bo'lsa */}
              {infoChanged && (
                <button onClick={saveInfo} disabled={saving} style={{
                  width:'100%', padding:'10px',
                  background: saved ? '#059669' : '#7C3AED',
                  color:'#fff', border:'none', borderRadius:10,
                  fontSize:14, fontWeight:700, cursor:'pointer'
                }}>
                  {saving ? 'Saqlanmoqda...' : saved ? '✅ Saqlandi!' : 'Saqlash'}
                </button>
              )}

              {/* Izohlar */}
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>💬 Izohlar</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8, maxHeight:200, overflowY:'auto' }}>
                  {notes.length === 0 && (
                    <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:'10px 0' }}>Hali izoh yo'q</div>
                  )}
                  {notes.map(note => {
                    const isMe = note.author === user.name
                    return (
                      <div key={note.id} style={{
                        padding:'7px 10px', borderRadius:8,
                        background: isMe ? '#EDE9FE' : 'var(--surface2)',
                        border:`1px solid ${isMe ? '#C4B5FD' : 'var(--border)'}`
                      }}>
                        <div style={{ fontSize:10, fontWeight:700, color:isMe?'#7C3AED':'var(--text2)', marginBottom:2 }}>
                          {note.author} · {timeStr(note.created_at)}
                        </div>
                        <div style={{ fontSize:12, color:'#000000', lineHeight:1.5 }}>{note.text}</div>
                      </div>
                    )
                  })}
                  <div ref={noteEndRef}/>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <input
                    type="text" placeholder="Izoh yozing..."
                    value={noteText} onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && handleNote()}
                    style={{
                      flex:1, padding:'7px 10px',
                      border:'1.5px solid var(--border)', borderRadius:8,
                      background:'var(--surface2)', color:'var(--text)',
                      fontSize:12, outline:'none', fontFamily:'inherit'
                    }}
                  />
                  <button onClick={handleNote} disabled={!noteText.trim()||addingNote} style={{
                    padding:'7px 12px', borderRadius:8, border:'none',
                    background:!noteText.trim()?'var(--border2)':'#7C3AED',
                    color:!noteText.trim()?'var(--text3)':'#fff',
                    fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0
                  }}>{addingNote?'...':'➤'}</button>
                </div>
              </div>

              {/* Qoshilgan sana */}
              <div style={{ fontSize:11, color:'var(--text3)', textAlign:'center' }}>
                Qo'shilgan: {new Date(lead.created_at).toLocaleDateString('uz-UZ')}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
