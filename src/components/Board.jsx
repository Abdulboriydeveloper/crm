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
  if (!raw) return ''
  const clean = raw.trim().toLowerCase().replace(/['']/g, "'").replace(/\s+/g,' ')
  const found = STAGES.find(s =>
    s.label.trim().toLowerCase().replace(/['']/g,"'") === clean
  )
  return found ? found.label : raw.trim()
}

function extractPhone(val) {
  for (const line of (val || '').split('\n')) {
    if (line.startsWith('Raqam:')) return line.replace('Raqam:', '').trim()
  }
  return val || ''
}

export default function Board({ leads, loading, onMoveCard, onSelectLead }) {
  // drag qilinayotgan kartaning phone raqami
  const [dragPhone, setDragPhone] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const enterCount = useRef({})

  const normalizedLeads = leads.map(l => ({ ...l, stage: normalizeStage(l.stage) }))
  const knownLabels = new Set(STAGES.map(s => s.label))

  const onDragStart = useCallback((lead) => {
    setDragPhone(extractPhone(lead.value))
  }, [])

  const onDragEnd = useCallback(() => {
    setDragPhone(null)
    setDragOverStage(null)
    enterCount.current = {}
  }, [])

  const onDragEnter = useCallback((label) => {
    enterCount.current[label] = (enterCount.current[label] || 0) + 1
    setDragOverStage(label)
  }, [])

  const onDragLeave = useCallback((label) => {
    enterCount.current[label] = (enterCount.current[label] || 0) - 1
    if ((enterCount.current[label] || 0) <= 0) {
      enterCount.current[label] = 0
      setDragOverStage(p => p === label ? null : p)
    }
  }, [])

  const onDrop = useCallback((label) => {
    if (dragPhone) {
      // Hozirgi stage ni top
      const lead = normalizedLeads.find(l => extractPhone(l.value) === dragPhone)
      if (!lead || lead.stage !== label) {
        onMoveCard(dragPhone, label)
      }
    }
    setDragPhone(null)
    setDragOverStage(null)
    enterCount.current = {}
  }, [dragPhone, normalizedLeads, onMoveCard])

  if (loading && normalizedLeads.length === 0) {
    return (
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', color:'var(--text2)', fontSize:14 }}>⏳ Yuklanmoqda...</div>
      </div>
    )
  }

  return (
    <div style={{
      flex:1, overflowX:'auto', overflowY:'hidden',
      padding:'12px 16px 16px', display:'flex', gap:10, alignItems:'flex-start'
    }}>
      {STAGES.map(stage => {
        const cols = normalizedLeads.filter(l => l.stage === stage.label)
        const isOver = dragOverStage === stage.label
        const dragging = dragPhone !== null

        return (
          <div
            key={stage.key}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDragEnter={() => onDragEnter(stage.label)}
            onDragLeave={() => onDragLeave(stage.label)}
            onDrop={() => onDrop(stage.label)}
            style={{
              width:210, minWidth:210,
              maxHeight:'calc(100vh - 80px)',
              display:'flex', flexDirection:'column',
              borderRadius:12,
              background: isOver ? `${stage.border}12` : 'var(--surface)',
              border: isOver ? `2px dashed ${stage.border}` : '1px solid var(--border)',
              overflow:'hidden', flexShrink:0,
              transition:'all .12s',
            }}
          >
            {/* Sarlavha */}
            <div style={{
              padding:'9px 12px 8px', borderBottom:'1px solid var(--border)',
              background:stage.bg, flexShrink:0
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7,height:7,borderRadius:'50%',background:stage.border }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:stage.border }}>{stage.label}</span>
                </div>
                <span style={{
                  fontSize:11, fontWeight:700,
                  background:'rgba(255,255,255,0.85)',
                  color:stage.border, padding:'1px 7px', borderRadius:20
                }}>{cols.length}</span>
              </div>
            </div>

            {/* Kartalar */}
            <div style={{
              flex:1, overflowY:'auto', padding:'6px',
              display:'flex', flexDirection:'column', gap:5, minHeight:60
            }}>
              {cols.length === 0 ? (
                <div style={{
                  textAlign:'center', padding:'18px 8px',
                  color: isOver ? stage.border : 'var(--text3)',
                  border: isOver ? `1.5px dashed ${stage.border}` : '1.5px dashed transparent',
                  borderRadius:8, fontSize:12, margin:2,
                  transition:'all .12s'
                }}>
                  {isOver ? '⬇ Tashlang' : "Bo'sh"}
                </div>
              ) : (
                cols.map(lead => (
                  <Card
                    key={lead.id}
                    lead={lead}
                    onMove={onMoveCard}
                    onClick={() => onSelectLead(lead)}
                    onDragStart={() => onDragStart(lead)}
                    onDragEnd={onDragEnd}
                    isDragging={extractPhone(lead.value) === dragPhone}
                  />
                ))
              )}
              {/* Drop zone hint when dragging to non-empty col */}
              {isOver && cols.length > 0 && dragging && (
                <div style={{
                  height:36, borderRadius:8, flexShrink:0,
                  border:`2px dashed ${stage.border}`,
                  background:`${stage.border}10`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, color:stage.border
                }}>⬇ Tashlang</div>
              )}
            </div>
          </div>
        )
      })}

      {/* Noma'lum stage lidlar */}
      {normalizedLeads.filter(l => !knownLabels.has(l.stage)).length > 0 && (
        <div style={{
          width:210, minWidth:210, maxHeight:'calc(100vh - 80px)',
          display:'flex', flexDirection:'column', borderRadius:12,
          background:'var(--surface)', border:'1px solid var(--border)',
          overflow:'hidden', flexShrink:0, opacity:0.75
        }}>
          <div style={{ padding:'9px 12px', borderBottom:'1px solid var(--border)', background:'#F9FAFB' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#6B7280' }}>Boshqa</span>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'6px', display:'flex', flexDirection:'column', gap:5 }}>
            {normalizedLeads.filter(l => !knownLabels.has(l.stage)).map(lead => (
              <Card
                key={lead.id}
                lead={lead}
                onMove={onMoveCard}
                onClick={() => onSelectLead(lead)}
                onDragStart={() => onDragStart(lead)}
                onDragEnd={onDragEnd}
                isDragging={extractPhone(lead.value) === dragPhone}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
