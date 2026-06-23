import { useState } from 'react'
import Card from './Card.jsx'
import { STAGES } from './Board.jsx'

function normalizeStage(raw) {
  if (!raw) return 'Yangi lid'
  const clean = raw.trim().toLowerCase().replace(/['']/g,"'").replace(/\s+/g,' ')
  return STAGES.find(s=>s.label.trim().toLowerCase().replace(/['']/g,"'")===clean)?.label || raw.trim()
}

export default function AdminBoard({ leads, loading, onAssignLead, onSelectLead, managers }) {
  const [filter, setFilter] = useState('all')
  const [assigning, setAssigning] = useState(null)

  const normalized = leads.map(l => ({ ...l, stage: normalizeStage(l.stage) }))
  const unassigned = normalized.filter(l => !l.assigned_to)

  const filtered = filter === 'all' ? normalized
    : filter === 'unassigned' ? unassigned
    : normalized.filter(l => l.assigned_to === filter)

  const handleAssign = async (lead, managerId) => {
    setAssigning(lead.id)
    await onAssignLead(lead.id, managerId)
    setAssigning(null)
  }

  if (loading && !normalized.length) {
    return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)' }}>⏳ Yuklanmoqda...</div>
  }

  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Filter tabs */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:12, color:'var(--text2)', marginRight:2 }}>Ko'rish:</span>
        {[
          { id:'all', label:`Barchasi (${normalized.length})`, color:'#7C3AED' },
          { id:'unassigned', label:`Taqsimlanmagan (${unassigned.length})`, color:'#D97706', warn: unassigned.length > 0 },
          ...managers.map(m => ({ id:m.id, label:`${m.name} (${normalized.filter(l=>l.assigned_to===m.id).length})`, color:m.color }))
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding:'4px 12px', borderRadius:20, fontSize:12, cursor:'pointer',
            border: filter===f.id ? `1.5px solid ${f.color}` : '1px solid var(--border)',
            background: filter===f.id ? f.color+'18' : 'var(--surface2)',
            color: filter===f.id ? f.color : 'var(--text2)', fontWeight: filter===f.id ? 700 : 400
          }}>{f.warn && '⚠️ '}{f.label}</button>
        ))}
      </div>

      {/* Kanban */}
      <div style={{ flex:1, overflowX:'auto', overflowY:'hidden', padding:'12px 16px 16px', display:'flex', gap:10, alignItems:'flex-start' }}>
        {STAGES.map(stage => {
          const cols = filtered.filter(l => l.stage === stage.label)
          return (
            <div key={stage.key} style={{
              width:210, minWidth:210, maxHeight:'calc(100vh - 130px)',
              display:'flex', flexDirection:'column', borderRadius:12,
              background:'var(--surface)', border:'1px solid var(--border)',
              overflow:'hidden', flexShrink:0
            }}>
              <div style={{ padding:'9px 12px 8px', borderBottom:'1px solid var(--border)', background:stage.bg, flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:stage.border }}/>
                    <span style={{ fontSize:11, fontWeight:700, color:stage.border }}>{stage.label}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, background:'rgba(255,255,255,0.85)', color:stage.border, padding:'1px 7px', borderRadius:20 }}>{cols.length}</span>
                </div>
              </div>
              <div style={{ flex:1, overflowY:'auto', padding:'6px', display:'flex', flexDirection:'column', gap:5 }}>
                {cols.length === 0
                  ? <div style={{ textAlign:'center', color:'var(--text3)', fontSize:11, padding:'16px 8px' }}>Bo'sh</div>
                  : cols.map(lead => (
                    <div key={lead.id}>
                      <div onClick={() => onSelectLead(lead)} style={{ cursor:'pointer' }}>
                        <Card lead={lead} onDragStart={()=>{}} onDragEnd={()=>{}} isDragging={false} onClick={() => onSelectLead(lead)} />
                      </div>
                      {/* Assign dropdown */}
                      <div style={{ marginTop:4 }}>
                        <select
                          value={lead.assigned_to || ''}
                          disabled={assigning === lead.id}
                          onChange={e => e.target.value && handleAssign(lead, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{
                            width:'100%', padding:'4px 7px', fontSize:11,
                            border:'1px solid var(--border)', borderRadius:7,
                            background:'var(--surface2)', color:'var(--text2)', cursor:'pointer'
                          }}
                        >
                          <option value="">Menejer tanlang...</option>
                          {managers.map(m => (
                            <option key={m.id} value={m.id}>
                              {lead.assigned_to === m.id ? '✓ ' : ''}{m.name}
                            </option>
                          ))}
                        </select>
                        {lead.assigned_to && (
                          <div style={{ fontSize:10, color:'var(--text3)', marginTop:3, paddingLeft:4 }}>
                            {managers.find(m=>m.id===lead.assigned_to)?.name} ga berilgan ✓
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
