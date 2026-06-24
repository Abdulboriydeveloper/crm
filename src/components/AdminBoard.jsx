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
  const [stageFilters, setStageFilters] = useState(new Set()) // bosqich filterlari
  const [assigning, setAssigning] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [bulkManager, setBulkManager] = useState('')
  const [bulkAssigning, setBulkAssigning] = useState(false)

  const normalized = leads.map(l => ({ ...l, stage: normalizeStage(l.stage) }))
  const unassigned = normalized.filter(l => !l.assigned_to)

  const byAssign = filter === 'all' ? normalized
    : filter === 'unassigned' ? unassigned
    : normalized.filter(l => l.assigned_to === filter)

  // Bosqich filteri
  const filtered = stageFilters.size === 0
    ? byAssign
    : byAssign.filter(l => stageFilters.has(l.stage))

  const toggleStageFilter = (stage) => {
    setStageFilters(prev => {
      const next = new Set(prev)
      next.has(stage) ? next.delete(stage) : next.add(stage)
      return next
    })
    setSelected(new Set())
  }

  const clearStageFilter = () => {
    setStageFilters(new Set())
    setSelected(new Set())
  }

  // Tanlash
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(l => l.id)))
    }
  }

  const clearSelection = () => setSelected(new Set())

  // Bitta lid assign
  const handleAssign = async (lead, managerId) => {
    setAssigning(lead.id)
    await onAssignLead(lead.id, managerId)
    setAssigning(null)
  }

  // Ko'plab assign
  const handleBulkAssign = async () => {
    if (!bulkManager || selected.size === 0) return
    setBulkAssigning(true)
    const ids = [...selected]
    for (const id of ids) {
      await onAssignLead(id, bulkManager)
    }
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

      {/* Filter tabs */}
      <div style={{
        padding:'10px 16px', borderBottom:'1px solid var(--border)',
        display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', alignItems:'center'
      }}>
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

      {/* Bosqich filterlari */}
      <div style={{
        padding:'8px 16px', borderBottom:'1px solid var(--border)',
        display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', alignItems:'center',
        background:'var(--surface)'
      }}>
        <span style={{ fontSize:11, color:'var(--text3)', marginRight:2, flexShrink:0 }}>Bosqich:</span>
        <button
          onClick={clearStageFilter}
          style={{
            padding:'3px 10px', borderRadius:20, fontSize:11, cursor:'pointer',
            border: stageFilters.size === 0 ? '1.5px solid #7C3AED' : '1px solid var(--border)',
            background: stageFilters.size === 0 ? '#EDE9FE' : 'var(--surface2)',
            color: stageFilters.size === 0 ? '#7C3AED' : 'var(--text2)',
            fontWeight: stageFilters.size === 0 ? 700 : 400
          }}
        >Hammasi</button>
        {STAGES.map(s => {
          const count = byAssign.filter(l => l.stage === s.label).length
          const active = stageFilters.has(s.label)
          return (
            <button key={s.key} onClick={() => toggleStageFilter(s.label)} style={{
              padding:'3px 10px', borderRadius:20, fontSize:11, cursor:'pointer',
              border: active ? `1.5px solid ${s.border}` : '1px solid var(--border)',
              background: active ? s.bg : 'var(--surface2)',
              color: active ? s.border : 'var(--text2)',
              fontWeight: active ? 700 : 400,
              display:'flex', alignItems:'center', gap:4
            }}>
              {s.label}
              <span style={{
                fontSize:10, fontWeight:700,
                background: active ? s.border : 'var(--border)',
                color: active ? '#fff' : 'var(--text3)',
                padding:'0px 5px', borderRadius:10, minWidth:16, textAlign:'center'
              }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Bulk action bar */}
      <div style={{
        padding:'8px 16px', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', gap:10, flexShrink:0,
        background: selected.size > 0 ? '#EDE9FE' : 'var(--surface2)',
        transition:'background .2s'
      }}>
        {/* Select all checkbox */}
        <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', userSelect:'none' }}>
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => { if(el) el.indeterminate = someSelected }}
            onChange={toggleSelectAll}
            style={{ width:16, height:16, cursor:'pointer', accentColor:'#7C3AED' }}
          />
          <span style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>
            {selected.size > 0 ? `${selected.size} ta tanlandi` : 'Hammasini tanlash'}
          </span>
        </label>

        {selected.size > 0 && (
          <>
            <div style={{ width:1, height:20, background:'var(--border)', margin:'0 4px' }}/>
            {/* Menejer tanlash */}
            <select
              value={bulkManager}
              onChange={e => setBulkManager(e.target.value)}
              style={{
                padding:'5px 10px', fontSize:12, borderRadius:8,
                border:'1px solid #C4B5FD', background:'#fff',
                color:'var(--text)', cursor:'pointer', outline:'none'
              }}
            >
              <option value="">Menejer tanlang...</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <button
              onClick={handleBulkAssign}
              disabled={!bulkManager || bulkAssigning}
              style={{
                padding:'5px 16px', borderRadius:8, fontSize:12, fontWeight:700,
                border:'none', cursor: !bulkManager ? 'not-allowed' : 'pointer',
                background: !bulkManager ? 'var(--border2)' : '#7C3AED',
                color: !bulkManager ? 'var(--text3)' : '#fff'
              }}
            >
              {bulkAssigning ? `Berilmoqda...` : `${selected.size} ta lidni bering`}
            </button>

            <button
              onClick={clearSelection}
              style={{
                padding:'5px 10px', borderRadius:8, fontSize:12,
                border:'1px solid var(--border)', background:'transparent',
                color:'var(--text2)', cursor:'pointer'
              }}
            >Bekor qilish</button>
          </>
        )}
      </div>

      {/* Kanban */}
      <div style={{
        flex:1, overflowX:'auto', overflowY:'hidden',
        padding:'12px 16px 16px', display:'flex', gap:10, alignItems:'flex-start'
      }}>
        {STAGES.filter(stage => stageFilters.size === 0 || stageFilters.has(stage.label)).map(stage => {
          const cols = filtered.filter(l => l.stage === stage.label)
          return (
            <div key={stage.key} style={{
              width:220, minWidth:220, maxHeight:'calc(100vh - 170px)',
              display:'flex', flexDirection:'column', borderRadius:12,
              background:'var(--surface)', border:'1px solid var(--border)',
              overflow:'hidden', flexShrink:0
            }}>
              {/* Col header */}
              <div style={{ padding:'9px 12px 8px', borderBottom:'1px solid var(--border)', background:stage.bg, flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:stage.border }}/>
                    <span style={{ fontSize:11, fontWeight:700, color:stage.border }}>{stage.label}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, background:'rgba(255,255,255,0.85)', color:stage.border, padding:'1px 7px', borderRadius:20 }}>{cols.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div style={{ flex:1, overflowY:'auto', padding:'6px', display:'flex', flexDirection:'column', gap:5 }}>
                {cols.length === 0
                  ? <div style={{ textAlign:'center', color:'var(--text3)', fontSize:11, padding:'16px 8px' }}>Bo'sh</div>
                  : cols.map(lead => {
                    const isSelected = selected.has(lead.id)
                    return (
                      <div key={lead.id} style={{
                        borderRadius:10, border: isSelected ? '2px solid #7C3AED' : '1px solid var(--border)',
                        background: isSelected ? '#F5F3FF' : 'var(--surface)',
                        transition:'all .12s'
                      }}>
                        {/* Checkbox + Card */}
                        <div style={{ display:'flex', alignItems:'flex-start', gap:6, padding:'8px 8px 4px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(lead.id)}
                            onClick={e => e.stopPropagation()}
                            style={{ marginTop:6, width:14, height:14, cursor:'pointer', accentColor:'#7C3AED', flexShrink:0 }}
                          />
                          <div style={{ flex:1, minWidth:0 }} onClick={() => onSelectLead(lead)}>
                            <AdminCard
                              lead={lead}
                              managers={managers}
                              onAssign={handleAssign}
                              assigning={assigning}
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

// Bitta karta — dropdown bilan
function AdminCard({ lead, managers, onAssign, assigning }) {
  const COLORS = [['#EDE9FE','#7C3AED'],['#DBEAFE','#2563EB'],['#DCFCE7','#16A34A'],['#FEF3C7','#D97706'],['#FCE7F3','#DB2777'],['#D1FAE5','#059669']]
  const ci = Math.abs((lead.name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % COLORS.length
  const [bg, fg] = COLORS[ci]

  function initials(name) {
    return (name||'?').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?'
  }

  const assignedManager = managers.find(m => m.id === lead.assigned_to)

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:bg, color:fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>
          {initials(lead.name)}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.name||'—'}</div>
          {lead.phone && <div style={{ fontSize:11, color:'var(--text2)' }}>{lead.phone}</div>}
        </div>
      </div>

      {/* Assign dropdown */}
      <select
        value={lead.assigned_to || ''}
        disabled={assigning === lead.id}
        onChange={e => e.target.value && onAssign(lead, e.target.value)}
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
          <option key={m.id} value={m.id}>
            {lead.assigned_to === m.id ? '✓ ' : ''}{m.name}
          </option>
        ))}
      </select>
    </div>
  )
}
