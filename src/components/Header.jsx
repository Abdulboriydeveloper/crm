export default function Header({ loading, searchQuery, onSearch, onRefresh, onSettings, totalLeads, user, onLogout, isAdmin }) {
  return (
    <header style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'0 16px', height:56, display:'flex', alignItems:'center', gap:10, flexShrink:0, zIndex:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        {/* <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#7C3AED,#C026D3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>💄</div> */}
        <div>
          <div style={{ fontWeight:700, fontSize:13, lineHeight:1.2 }}>Elite CRM</div>
          <div style={{ fontSize:10, color:'var(--text3)', lineHeight:1.2 }}>{totalLeads} lid · {isAdmin ? '👑 Admin' : '👤 Menejer'}</div>
        </div>
      </div>

      <div style={{ flex:1, maxWidth:260, position:'relative' }}>
        <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:13, pointerEvents:'none' }}>🔍</span>
        <input type="text" placeholder="Qidirish..." value={searchQuery} onChange={e => onSearch(e.target.value)}
          style={{ width:'100%', padding:'6px 10px 6px 28px', border:'1px solid var(--border)', borderRadius:8, background:'var(--surface2)', color:'var(--text)', fontSize:13, outline:'none' }}
        />
      </div>

      <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
        <button onClick={onRefresh} disabled={loading} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text2)', fontSize:12, cursor:'pointer', opacity:loading?0.6:1 }}>
          <span style={{ display:'inline-block', animation:loading?'spin 0.7s linear infinite':'none' }}>↻</span> Yangilash
        </button>
        <button onClick={onSettings} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text2)', fontSize:12, cursor:'pointer' }}>⚙️</button>
        {user && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:4 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:user.color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{user.initials}</div>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{user.name}</span>
            <button onClick={onLogout} style={{ padding:'4px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text2)', fontSize:11, cursor:'pointer' }}>Chiqish</button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </header>
  )
}
