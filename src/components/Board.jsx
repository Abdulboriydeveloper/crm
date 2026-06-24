import { useState, useRef, useCallback } from 'react'
import Card from './Card.jsx'

export const STAGES = [
  { key:'new',     label:'Yangi lid',        bg:'#DCFCE7', border:'#16A34A' },
  { key:'chek',    label:'Chek yubordi',      bg:'#DBEAFE', border:'#2563EB' },
  { key:'malumot', label:"Ma'lumot berildi",  bg:'#EDE9FE', border:'#7C3AED' },
  { key:'qayta',   label:'Qayta aloqa',       bg:'#FEF3C7', border:'#D97706' },
  { key:'tolov',   label:"To'lov kutilmoqda", bg:'#FEE2E2', border:'#DC2626' },
  { key:'joy',     label:'Joy band qildi',    bg:'#D1FAE5', border:'#059669' },
  { key:'tuliq',   label:"To'liq to'lov",     bg:'#A7F3D0', border:'#047857' },
  { key:'atkaz',   label:'Atkaz',             bg:'#F3F4F6', border:'#6B7280' },
]

function normalizeStage(raw) {
  if (!raw) return 'Yangi lid'
  const clean = raw.trim().toLowerCase().replace(/['']/g,"'").replace(/\s+/g,' ')
  return STAGES.find(s => s.label.trim().toLowerCase().replace(/['']/g,"'") === clean)?.label || raw.trim()
}

function formatSum(amount) {
  if (!amount) return null
  return Number(amount).toLocaleString('uz-UZ') + " so'm"
}

export default function Board({ leads, loading, onMoveCard, onSelectLead, isManager }) {
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)
  const enterCount = useRef({})

  const normalized = leads.map(l => ({ ...l, stage: normalizeStage(l.stage) }))
  // Menejer uchun Atkaz ko'rinmasin
  const visible = isManager ? normalized.filter(l => l.stage !== 'Atkaz') : normalized

  const onDragStart = useCallback((lead) => setDragId(lead.id), [])
  const onDragEnd = useCallback(() => { setDragId(null); setOverStage(null); enterCount.current = {} }, [])
  const onEnter = useCallback((label) => {
    enterCount.current[label] = (enterCount.current[label]||0)+1
    setOverStage(label)
  }, [])
  const onLeave = useCallback((label) => {
    enterCount.current[label] = (enterCount.current[label]||0)-1
    if ((enterCount.current[label]||0) <= 0) setOverStage(p => p===label ? null : p)
  }, [])
  const onDrop = useCallback((label) => {
    const lead = visible.find(l => l.id === dragId)
    if (lead && lead.stage !== label) onMoveCard(lead.id, label)
    setDragId(null); setOverStage(null); enterCount.current = {}
  }, [dragId, visible, onMoveCard])

  if (loading && !visible.length) {
    return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)' }}>⏳ Yuklanmoqda...</div>
  }

  // Har ustun uchun jami summa
  const stageTotal = (stageLabel) => {
    const stageLeads = visible.filter(l => l.stage === stageLabel)
    const total = stageLeads.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)
    return { count: stageLeads.length, total }
  }

  // Umumiy jami
  const grandTotal = visible.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Umumiy statistika */}
      {grandTotal > 0 && (
        <div style={{
          padding:'6px 16px', borderBottom:'1px solid var(--border)',
          flexShrink:0, display:'flex', alignItems:'center', gap:16,
          background:'var(--surface)', fontSize:12
        }}>
          <span style={{ color:'var(--text2)' }}>Jami:</span>
          <span style={{ fontWeight:700, color:'#059669' }}>
            💰 {grandTotal.toLocaleString('uz-UZ')} so'm
          </span>
          <span style={{ color:'var(--text3)' }}>({visible.length} ta lid)</span>
        </div>
      )}

      <div style={{ flex:1, overflowX:'auto', overflowY:'hidden', padding:'12px 16px 16px', display:'flex', gap:10, alignItems:'flex-start' }}>
        {STAGES.filter(s => !isManager || s.label !== 'Atkaz').map(stage => {
          const { count, total } = stageTotal(stage.label)
          const isOver = overStage === stage.label
          return (
            <div key={stage.key}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect='move' }}
              onDragEnter={() => onEnter(stage.label)}
              onDragLeave={() => onLeave(stage.label)}
              onDrop={() => onDrop(stage.label)}
              style={{
                width:210, minWidth:210, maxHeight:'calc(100vh - 120px)',
                display:'flex', flexDirection:'column', borderRadius:12,
                background: isOver ? `${stage.border}12` : 'var(--surface)',
                border: isOver ? `2px dashed ${stage.border}` : '1px solid var(--border)',
                overflow:'hidden', flexShrink:0, transition:'all .12s'
              }}
            >
              {/* Sarlavha */}
              <div style={{ padding:'9px 12px 8px', borderBottom:'1px solid var(--border)', background:stage.bg, flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: total > 0 ? 4 : 0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:stage.border }}/>
                    <span style={{ fontSize:11, fontWeight:700, color:stage.border }}>{stage.label}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, background:'rgba(255,255,255,0.85)', color:stage.border, padding:'1px 7px', borderRadius:20 }}>{count}</span>
                </div>
                {/* Ustun summasi */}
                {total > 0 && (
                  <div style={{ fontSize:10, fontWeight:600, color:stage.border, opacity:0.8 }}>
                    💰 {total.toLocaleString('uz-UZ')} so'm
                  </div>
                )}
              </div>

              <div style={{ flex:1, overflowY:'auto', padding:'6px', display:'flex', flexDirection:'column', gap:5, minHeight:60 }}>
                {count === 0
                  ? <div style={{ textAlign:'center', color: isOver ? stage.border : 'var(--text3)', fontSize:11, padding:'16px 8px', border: isOver ? `1.5px dashed ${stage.border}` : '1.5px dashed transparent', borderRadius:8, margin:2 }}>
                      {isOver ? '⬇ Tashlang' : "Bo'sh"}
                    </div>
                  : visible.filter(l => l.stage === stage.label).map(lead => (
                    <Card key={lead.id} lead={lead}
                      onDragStart={() => onDragStart(lead)} onDragEnd={onDragEnd}
                      isDragging={lead.id === dragId} onClick={() => onSelectLead(lead)}
                    />
                  ))
                }
                {isOver && count > 0 && dragId && (
                  <div style={{ height:36, borderRadius:8, border:`2px dashed ${stage.border}`, background:`${stage.border}10`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:stage.border }}>⬇ Tashlang</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
