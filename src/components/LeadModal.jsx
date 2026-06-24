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
  const [movingTo, setMovingTo] = useState(null)
  const [tab, setTab] = useState('chat')
  const [amount, setAmount] = useState(lead.amount || '')
  const [savingAmount, setSavingAmount] = useState(false)
  const [amountSaved, setAmountSaved] = useState(false)
  const msgEndRef = useRef(null)
  const noteEndRef = useRef(null)

  const ci = Math.abs((lead.name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % COLORS.length
  const [avatarBg, avatarFg] = COLORS[ci]
  const currentStage = STAGES.find(s => s.label === lead.stage)

  // Xabarlarni yuklash
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

    // Real-time: yangi xabar kelsa avtomatik yangilanadi
    const sub = supabase
      .channel(`messages-${lead.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `lead_id=eq.${lead.id}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => sub.unsubscribe()
  }, [lead.id])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    noteEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes])

  const handleMove = async (stage) => {
    if (stage === lead.stage) return
    setMovingTo(stage)
    await onMove(lead.id, stage)
    setMovingTo(null)
  }

  const saveAmount = async () => {
    setSavingAmount(true)
    try {
      await supabase.from('leads').update({ amount: Number(amount) || 0 }).eq('id', lead.id)
      setAmountSaved(true)
      setTimeout(() => setAmountSaved(false), 2000)
    } catch(e) { console.error(e) }
    setSavingAmount(false)
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

  // CRM dan botni nomidan xabar yuborish
  const handleSendChat = async () => {
    if (!chatText.trim() || !lead.chat_id) return
    setSendingMsg(true)
    const textToSend = chatText.trim()
    setChatText('')
    try {
      // Supabase ga saqlash
      const { data: savedMsg } = await supabase.from('messages').insert([{
        lead_id: lead.id,
        chat_id: lead.chat_id,
        text: textToSend,
        from_bot: true,
        msg_type: 'text'
      }]).select().single()
      if (savedMsg) setMessages(prev => [...prev, savedMsg])

      // Bot server orqali foydalanuvchiga yuborish
      const BOT_URL = import.meta.env.VITE_BOT_URL
      if (BOT_URL) {
        await fetch(`${BOT_URL}/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: lead.chat_id, text: textToSend, lead_id: lead.id })
        })
      }
    } catch(e) { console.error('Send xato:', e) }
    setSendingMsg(false)
  }

  const tabs = [
    { id: 'chat', label: `💬 Chat (${messages.length})` },
    { id: 'info', label: "📋 Ma'lumot" },
    { id: 'notes', label: `📝 Izohlar (${notes.length})` },
  ]

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.55)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16
    }}>
      <div style={{
        background:'var(--surface)', borderRadius:18, width:'100%', maxWidth:480,
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)', display:'flex', flexDirection:'column',
        height:'85vh', overflow:'hidden'
      }}>
        {/* Header */}
        <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:avatarBg, color:avatarFg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, flexShrink:0 }}>
                {initials(lead.name)}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700 }}>{lead.name||'—'}</div>
                {lead.phone && <a href={`tel:${lead.phone}`} style={{ fontSize:12, color:'#7C3AED', textDecoration:'none' }}>📞 {lead.phone}</a>}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {/* Stage badge */}
              <div style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:currentStage?.bg||'var(--surface2)', color:currentStage?.border||'var(--text2)', border:`1px solid ${currentStage?.border||'var(--border)'}33` }}>
                {lead.stage}
              </div>
              <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'var(--text2)', cursor:'pointer' }}>×</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding:'5px 14px', borderRadius:8, fontSize:12, cursor:'pointer',
                border: tab===t.id ? '1.5px solid #7C3AED' : '1px solid var(--border)',
                background: tab===t.id ? '#EDE9FE' : 'var(--surface2)',
                color: tab===t.id ? '#7C3AED' : 'var(--text2)',
                fontWeight: tab===t.id ? 700 : 400
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>

          {/* ── CHAT TAB ── */}
          {tab === 'chat' && (
            <>
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
                        maxWidth:'80%', padding:'8px 12px', borderRadius: isBot ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isBot ? '#7C3AED' : 'var(--surface2)',
                        color: isBot ? '#fff' : 'var(--text)',
                        border: isBot ? 'none' : '1px solid var(--border)'
                      }}>
                        {!isBot && (
                          <div style={{ fontSize:10, fontWeight:700, color:'#7C3AED', marginBottom:3 }}>
                            {lead.name}
                          </div>
                        )}
                        {msg.msg_type === 'photo' && msg.text && msg.text.startsWith('http') ? (<img src={msg.text} alt="chek" style={{ maxWidth:'100%', borderRadius:8, display:'block', marginBottom:4 }} />) : msg.msg_type === 'photo' ? (<div style={{ fontSize:13 }}>📸 Rasm</div>) : (<div style={{ fontSize:13, lineHeight:1.5, whiteSpace:'pre-wrap' }}>{msg.text}</div>)}
                        <div style={{ fontSize:10, opacity:0.7, marginTop:3, textAlign:'right' }}>
                          {timeStr(msg.created_at)}
                        </div>
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
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                    style={{
                      flex:1, padding:'9px 12px', border:'1.5px solid var(--border)',
                      borderRadius:10, background:'var(--surface2)',
                      color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit'
                    }}
                  />
                  <button onClick={handleSendChat} disabled={!chatText.trim() || sendingMsg} style={{
                    padding:'9px 16px', background: !chatText.trim() ? 'var(--border2)' : '#7C3AED',
                    color: !chatText.trim() ? 'var(--text3)' : '#fff',
                    border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0
                  }}>
                    {sendingMsg ? '...' : '➤'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── INFO TAB ── */}
          {tab === 'info' && (
            <div style={{ flex:1, overflowY:'auto', padding:'14px 20px' }}>
              {/* Move stage */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8, fontWeight:600 }}>Bosqichni o'zgartirish</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {STAGES.map(s => (
                    <button key={s.key} onClick={() => handleMove(s.label)} disabled={!!movingTo} style={{
                      padding:'4px 11px', borderRadius:20, fontSize:11, cursor:'pointer',
                      border:`1px solid ${s.label===lead.stage ? s.border : 'var(--border)'}`,
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
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {managers.map(m => (
                      <button key={m.id} onClick={() => onAssign(lead.id, m.id)} style={{
                        padding:'5px 14px', borderRadius:20, fontSize:12, cursor:'pointer',
                        border:`1.5px solid ${lead.assigned_to===m.id ? m.color : 'var(--border)'}`,
                        background: lead.assigned_to===m.id ? m.color+'18' : 'var(--surface2)',
                        color: lead.assigned_to===m.id ? m.color : 'var(--text2)',
                        fontWeight: lead.assigned_to===m.id ? 700 : 400,
                        display:'flex', alignItems:'center', gap:6
                      }}>
                        <div style={{ width:18, height:18, borderRadius:'50%', background:m.color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700 }}>{m.initials}</div>
                        {m.name}{lead.assigned_to===m.id && ' ✓'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Summa kiritish */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8, fontWeight:600 }}>💰 Summa (so'm)</div>
                <div style={{ display:'flex', gap:8 }}>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveAmount()}
                    style={{
                      flex:1, padding:'8px 12px',
                      border:'1.5px solid var(--border)', borderRadius:10,
                      background:'var(--surface2)', color:'var(--text)',
                      fontSize:14, outline:'none', fontFamily:'inherit'
                    }}
                  />
                  <button onClick={saveAmount} disabled={savingAmount} style={{
                    padding:'8px 16px', borderRadius:10, border:'none',
                    background: amountSaved ? '#059669' : '#7C3AED',
                    color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0
                  }}>
                    {savingAmount ? '...' : amountSaved ? '✓ Saqlandi' : 'Saqlash'}
                  </button>
                </div>
                {amount > 0 && (
                  <div style={{ fontSize:12, color:'#059669', marginTop:5, fontWeight:600 }}>
                    = {Number(amount).toLocaleString('uz-UZ')} so'm
                  </div>
                )}
              </div>

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

          {/* ── NOTES TAB ── */}
          {tab === 'notes' && (
            <>
              <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                {notes.length === 0 && (
                  <div style={{ textAlign:'center', color:'var(--text3)', fontSize:13, padding:'24px 0' }}>Hali izoh yo'q</div>
                )}
                {notes.map(note => {
                  const isMe = note.author === user.name
                  return (
                    <div key={note.id} style={{
                      padding:'8px 12px', borderRadius:10,
                      background: isMe ? '#EDE9FE' : 'var(--surface2)',
                      border:`1px solid ${isMe ? '#C4B5FD' : 'var(--border)'}`,
                      alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth:'85%'
                    }}>
                      <div style={{ fontSize:10, fontWeight:700, color: isMe ? '#7C3AED' : 'var(--text2)', marginBottom:3 }}>
                        {note.author} · {timeStr(note.created_at)}
                      </div>
                      <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{note.text}</div>
                    </div>
                  )
                })}
                <div ref={noteEndRef}/>
              </div>
              <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
                <div style={{ display:'flex', gap:8 }}>
                  <input
                    type="text"
                    placeholder="Izoh yozing... (Enter)"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleNote()}
                    style={{
                      flex:1, padding:'9px 12px', border:'1.5px solid var(--border)',
                      borderRadius:10, background:'var(--surface2)',
                      color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit'
                    }}
                  />
                  <button onClick={handleNote} disabled={!noteText.trim() || addingNote} style={{
                    padding:'9px 16px', background: !noteText.trim() ? 'var(--border2)' : '#7C3AED',
                    color: !noteText.trim() ? 'var(--text3)' : '#fff',
                    border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer'
                  }}>
                    {addingNote ? '...' : '➤'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
