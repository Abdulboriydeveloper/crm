import { useState } from 'react'
import { STAGES } from './Board.jsx'

const COLORS = [['#EDE9FE','#7C3AED'],['#DBEAFE','#2563EB'],['#DCFCE7','#16A34A'],['#FEF3C7','#D97706'],['#FCE7F3','#DB2777'],['#D1FAE5','#059669']]

function initials(name) {
  return (name||'?').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?'
}

function fmt(amount) {
  if (!amount || Number(amount) === 0) return "0 so'm"
  return Number(amount).toLocaleString('uz-UZ') + " so'm"
}

function normalizeStage(raw) {
  if (!raw) return 'Yangi lid'
  const clean = raw.trim().toLowerCase().replace(/['']/g,"'").replace(/\s+/g,' ')
  return STAGES.find(s=>s.label.trim().toLowerCase().replace(/['']/g,"'")===clean)?.label || raw.trim()
}

function AdminCard({ lead, managers, onAssign, assigning, onClick }) {
  const ci = Math.abs((lead.name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % COLORS.length
  const [bg, fg] = COLORS[ci]
  const assignedManager = managers.find(m => m.id === lead.assigned_to)
  const amount = Number(lead.amount) || 0

  return (
    <div onClick={onClick} style={{ cursor:'pointer' }}>
      {/* Ism + avatar */}
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:bg, color:fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>
          {initials(lead.name)}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.name||'—'}</div>
          {lead.phone && <div style={{ fontSize:11, color:'var(--text2)' }}>{lead.phone}</div>}
        </div>
      </div>

      {/* Summa */}
      <div style={{
        fontSize:11, fontWeight:700,
        color: amount > 0 ? '#059669' : 'var(--text3)',
        background: amount > 0 ? '#D1FAE5' : 'var(--surface2)',
        borderRadius:6, padding:'2px 7px',
        display:'inline-block', marginBottom:5
      }}>
        💰 {fmt(amount)}
      </div>

      {/* Menejer dropdown */}
      <select
        value={lead.assigned_to || ''}
        disabled={assigning === lead.id}
        onChange={e => { e.stopPropagation(); e.target.value && onAssign(lead, e.target.value) }}
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%', padding:'4px 7px', fontSize:11,
          border: assignedManager ? `1px solid ${assignedManager.color}` : '1px solid var(--border)',
          borderRadius:7,
          background: assignedManager ? assignedManager.color+'10' : 'var(--surface2)',
          color: assignedManager ? assignedManager.color : 'var(--text2)',
          cursor:'pointer', fontWeight: assignedManager ? 600 : 400
        }}
      >
        <option value="">Menejer tanlang...</option>
        {managers.map(m => (
          <option key={m.id} value={m.id}>{lead.assigned_to===m.id?'✓ ':''}{m.name}</option>
        ))}
      </select>
    </div>
  )
}

export default function AdminBoard({ leads, loading, onAssignLead, onSelectLead, managers }) {
  const [filter, setFilter] = useState('all')
  const [stageFilters, setStageFilters] = useState(new Set())
  const [assigning, setAssigning] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [bulkManager, setBulkManager] = useState('')
  const [bulkAssigning, setBulkAssigning] = useState(false)

  const normalized = leads.map(l => ({ ...l, stage: normalizeStage(l.stage) }))
  const unassigned = normalized.filter(l => !l.assigned_to)

  // Assign filteri
  const byAssign = filter === 'all' ? normalized
    : filter === 'unassigned' ? unassigned
    : normalized.filter(l => l.assigned_to === filter)

  // Bosqich filteri
  const filtered = stageFilters.size === 0
    ? byAssign
    : byAssign.filter(l => stageFilters.has(l.stage))

  // Jami summa (filtered)
  const totalAmount = filtered.reduce((sum, l) => sum + (Number(l.amount)||0), 0)

  const toggleStageFilter = (stage) => {
    setStageFilters(prev => {
      const next = new Set(prev)
      next.has(stage) ? next.delete(stage) : next.add(stage)
      return next
    })
    setSelected(new Set())
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(l=>l.id)))
  }

  const clearSelection = () => setSelected(new Set())

  const handleAssign = async (lead, managerId) => {
    setAssigning(lead.id)
    await onAssignLead(lead.id, managerId)
    setAssigning(null)
  }

  const handleBulkAssign = async () => {
    if (!bulkManager || selected.size === 0) return
    setBulkAssigning(true)
    for (const id of [...selected]) await onAssignLead(id, bulkManager)
    setSelected(new Set())
    setBulkManager('')
    setBulkAssigning(false)
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const someSelected = selected.size > 0 && !allSelected

  if (loading && !normalized.length) {
    return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)' }}>⏳ Yuklanmoqda...</div>
  }

  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>

      {/* 1. Assign filterlari */}
      <div style={{ padding:'8px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', alignItems:'center', background:'var(--surface)' }}>
        <span style={{ fontSize:12, color:'var(--text2)', marginRight:2 }}>Ko'rish:</span>
        {[
          { id:'all', label:`Barchasi (${normalized.length})`, color:'#7C3AED' },
          { id:'unassigned', label:`Taqsimlanmagan (${unassigned.length})`, color:'#D97706', warn: unassigned.length > 0 },
          ...managers.map(m => ({ id:m.id, label:`${m.name} (${normalized.filter(l=>l.assigned_to===m.id).length})`, color:m.color }))
        ].map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); clearSelection() }} style={{
            padding:'4px 12px', borderRadius:20, fontSize:12, cursor:'pointer',
            border: filter===f.id ? `1.5px solid ${f.color}` : '1px solid var(--border)',
            background: filter===f.id ? f.color+'18' : 'var(--surface2)',
            color: filter===f.id ? f.color : 'var(--text2)', fontWeight: filter===f.id ? 700 : 400
          }}>{f.warn && '⚠️ '}{f.label}</button>
        ))}
      </div>

      {/* 2. Bosqich filterlari */}
      <div style={{ padding:'7px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:5, flexShrink:0, flexWrap:'wrap', alignItems:'center', background:'var(--surface)' }}>
        <span style={{ fontSize:11, color:'var(--text3)', marginRight:2, flexShrink:0 }}>Bosqich:</span>
        <button onClick={() => { setStageFilters(new Set()); setSelected(new Set()) }} style={{
          padding:'3px 10px', borderRadius:20, fontSize:11, cursor:'pointer',
          border: stageFilters.size===0 ? '1.5px solid #7C3AED' : '1px solid var(--border)',
          background: stageFilters.size===0 ? '#EDE9FE' : 'var(--surface2)',
          color: stageFilters.size===0 ? '#7C3AED' : 'var(--text2)', fontWeight: stageFilters.size===0 ? 700 : 400
        }}>Hammasi</button>
        {STAGES.map(s => {
          const count = byAssign.filter(l=>l.stage===s.label).length
          const active = stageFilters.has(s.label)
          return (
            <button key={s.key} onClick={() => toggleStageFilter(s.label)} style={{
              padding:'3px 10px', borderRadius:20, fontSize:11, cursor:'pointer',
              border: active ? `1.5px solid ${s.border}` : '1px solid var(--border)',
              background: active ? s.bg : 'var(--surface2)',
              color: active ? s.border : 'var(--text2)', fontWeight: active ? 700 : 400,
              display:'flex', alignItems:'center', gap:4
            }}>
              {s.label}
              <span style={{ fontSize:10, fontWeight:700, background: active?s.border:'var(--border)', color: active?'#fff':'var(--text3)', padding:'0 5px', borderRadius:10 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* 3. Bulk action bar */}
      <div style={{
        padding:'7px 16px', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', gap:10, flexShrink:0,
        background: selected.size > 0 ? '#EDE9FE' : 'var(--surface2)', transition:'background .2s'
      }}>
        {/* Checkbox + jami */}
        <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', userSelect:'none' }}>
          <input type="checkbox" checked={allSelected}
            ref={el => { if(el) el.indeterminate = someSelected }}
            onChange={toggleSelectAll}
            style={{ width:15, height:15, cursor:'pointer', accentColor:'#7C3AED' }}
          />
          <span style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>
            {selected.size > 0 ? `${selected.size} ta tanlandi` : 'Hammasini tanlash'}
          </span>
        </label>

        {/* Jami summa */}
        <div style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:'#059669' }}>
          💰 {fmt(totalAmount)} · {filtered.length} ta lid
        </div>

        {selected.size > 0 && (
          <>
            <div style={{ width:1, height:20, background:'var(--border)' }}/>
            <select value={bulkManager} onChange={e=>setBulkManager(e.target.value)} style={{
              padding:'5px 10px', fontSize:12, borderRadius:8,
              border:'1px solid #C4B5FD', background:'#fff', color:'var(--text)', cursor:'pointer', outline:'none'
            }}>
              <option value="">Menejer tanlang...</option>
              {managers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button onClick={handleBulkAssign} disabled={!bulkManager||bulkAssigning} style={{
              padding:'5px 16px', borderRadius:8, fontSize:12, fontWeight:700, border:'none',
              cursor: !bulkManager?'not-allowed':'pointer',
              background: !bulkManager?'var(--border2)':'#7C3AED',
              color: !bulkManager?'var(--text3)':'#fff'
            }}>{bulkAssigning ? 'Berilmoqda...' : `${selected.size} ta lidni bering`}</button>
            <button onClick={clearSelection} style={{
              padding:'5px 10px', borderRadius:8, fontSize:12,
              border:'1px solid var(--border)', background:'transparent', color:'var(--text2)', cursor:'pointer'
            }}>✕</button>
          </>
        )}
      </div>

      {/* 4. Kanban */}
      <div style={{ flex:1, overflowX:'auto', overflowY:'hidden', padding:'10px 16px 16px', display:'flex', gap:10, alignItems:'flex-start' }}>
        {STAGES.filter(stage => stageFilters.size===0 || stageFilters.has(stage.label)).map(stage => {
          const cols = filtered.filter(l=>l.stage===stage.label)
          const colTotal = cols.reduce((s,l)=>s+(Number(l.amount)||0),0)
          return (
            <div key={stage.key} style={{
              width:220, minWidth:220, maxHeight:'calc(100vh - 200px)',
              display:'flex', flexDirection:'column', borderRadius:12,
              background:'var(--surface)', border:'1px solid var(--border)',
              overflow:'hidden', flexShrink:0
            }}>
              {/* Col header */}
              <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', background:stage.bg, flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:stage.border }}/>
                    <span style={{ fontSize:11, fontWeight:700, color:stage.border }}>{stage.label}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, background:'rgba(255,255,255,0.85)', color:stage.border, padding:'1px 7px', borderRadius:20 }}>{cols.length}</span>
                </div>
                {/* Ustun summasi */}
                <div style={{ fontSize:10, fontWeight:600, color:stage.border, opacity:0.75 }}>
                  💰 {fmt(colTotal)}
                </div>
              </div>

              {/* Cards */}
              <div style={{ flex:1, overflowY:'auto', padding:'6px', display:'flex', flexDirection:'column', gap:5 }}>
                {cols.length===0
                  ? <div style={{ textAlign:'center', color:'var(--text3)', fontSize:11, padding:'16px 8px' }}>Bo'sh</div>
                  : cols.map(lead => {
                    const isSel = selected.has(lead.id)
                    return (
                      <div key={lead.id} style={{
                        borderRadius:10, padding:'8px 8px 6px',
                        border: isSel ? '2px solid #7C3AED' : '1px solid var(--border)',
                        background: isSel ? '#F5F3FF' : 'var(--surface)',
                        transition:'all .12s'
                      }}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:6 }}>
                          <input type="checkbox" checked={isSel}
                            onChange={() => toggleSelect(lead.id)}
                            onClick={e=>e.stopPropagation()}
                            style={{ marginTop:4, width:13, height:13, cursor:'pointer', accentColor:'#7C3AED', flexShrink:0 }}
                          />
                          <div style={{ flex:1, minWidth:0 }}>
                            <AdminCard
                              lead={lead}
                              managers={managers}
                              onAssign={handleAssign}
                              assigning={assigning}
                              onClick={() => onSelectLead(lead)}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
