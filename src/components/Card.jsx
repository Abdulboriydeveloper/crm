const COLORS = [['#EDE9FE','#7C3AED'],['#DBEAFE','#2563EB'],['#DCFCE7','#16A34A'],['#FEF3C7','#D97706'],['#FCE7F3','#DB2777'],['#D1FAE5','#059669']]

function initials(name) {
  return (name||'?').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?'
}

function formatAmount(amount) {
  if (!amount) return null
  return Number(amount).toLocaleString('uz-UZ') + " so'm"
}

export default function Card({ lead, onDragStart, onDragEnd, isDragging, onClick }) {
  const ci = Math.abs((lead.name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % COLORS.length
  const [bg, fg] = COLORS[ci]
  const amountStr = formatAmount(lead.amount)

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain', lead.id); onDragStart() }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10,
        padding:'9px 9px 8px', cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.4 : 1, transition:'opacity .12s', userSelect:'none'
      }}
      onMouseEnter={e => { if(!isDragging) e.currentTarget.style.borderColor='var(--border2)' }}
      onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
    >
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <div style={{ width:30, height:30, borderRadius:'50%', background:bg, color:fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
          {initials(lead.name)}
        </div>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.name||'—'}</div>
          {lead.phone && <div style={{ fontSize:11, color:'var(--text2)' }}>{lead.phone}</div>}
        </div>
        <div style={{ color:'var(--text3)', fontSize:14, flexShrink:0, cursor:'grab' }}>⠿</div>
      </div>

      {/* Summa */}
      {amountStr && (
        <div style={{
          marginTop:6,
          fontSize:11, fontWeight:700,
          color:'#059669',
          background:'#D1FAE5',
          borderRadius:6, padding:'2px 7px',
          display:'inline-block'
        }}>
          💰 {amountStr}
        </div>
      )}
    </div>
  )
}
