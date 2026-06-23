function parseCard(val) {
  const lines = (val || '').split('\n')
  let name = '', phone = ''
  for (const l of lines) {
    if (l.startsWith('Ism:')) name = l.replace('Ism:', '').trim()
    else if (l.startsWith('Raqam:')) phone = l.replace('Raqam:', '').trim()
  }
  if (!name && !phone) name = val || '—'
  return { name, phone }
}

function getInitials(name) {
  return (name || '?').split(' ').slice(0,2).map(w => w[0] || '').join('').toUpperCase() || '?'
}

const COLORS = [
  ['#EDE9FE','#7C3AED'],['#DBEAFE','#2563EB'],['#DCFCE7','#16A34A'],
  ['#FEF3C7','#D97706'],['#FCE7F3','#DB2777'],['#D1FAE5','#059669'],
]

export default function Card({ lead, onMove, onClick, onDragStart, onDragEnd, isDragging }) {
  const { name, phone } = parseCard(lead.value)
  const ci = Math.abs((name||'').split('').reduce((a,c) => a + c.charCodeAt(0), 0)) % COLORS.length
  const [bg, fg] = COLORS[ci]

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        // dataTransfer ga ma'lumot yozish (ba'zi browser lar talab qiladi)
        e.dataTransfer.setData('text/plain', phone || lead.value)
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background:'var(--surface)',
        border:'1px solid var(--border)',
        borderRadius:10,
        padding:'9px 9px 8px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? 'scale(0.96) rotate(1deg)' : 'scale(1)',
        transition:'opacity .12s, transform .12s',
        userSelect:'none', WebkitUserSelect:'none',
        boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
      }}
      onMouseEnter={e => {
        if (!isDragging) e.currentTarget.style.borderColor = 'var(--border2)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        {/* Avatar */}
        <div style={{
          width:30, height:30, borderRadius:'50%',
          background:bg, color:fg, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:11, fontWeight:700,
        }}>{getInitials(name)}</div>

        {/* Info */}
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{
            fontSize:12, fontWeight:600, color:'var(--text)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
          }}>{name || '—'}</div>
          {phone && <div style={{ fontSize:11, color:'var(--text2)' }}>{phone}</div>}
        </div>

        {/* Drag handle */}
        <div style={{ color:'var(--text3)', fontSize:14, flexShrink:0, cursor:'grab' }}>⠿</div>
      </div>
    </div>
  )
}
