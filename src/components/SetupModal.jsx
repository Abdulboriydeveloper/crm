export default function SetupModal({ onClose }) {
  const url = import.meta.env.VITE_SUPABASE_URL || ''
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  const connected = url && key

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--surface)', borderRadius:16, padding:24, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:15, fontWeight:700 }}>⚙️ Supabase ulanish</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'var(--text2)', cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:14, borderRadius:10, background:connected?'#D1FAE5':'#FEF3C7', border:`1px solid ${connected?'#6EE7B7':'#FCD34D'}`, marginBottom:16, fontSize:13, color:connected?'#047857':'#92400E' }}>
          {connected ? '✅ Supabase ulangan' : '⚠️ Supabase sozlanmagan'}
        </div>
        <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:14, fontSize:12, color:'var(--text2)', lineHeight:1.9 }}>
          <div style={{ fontWeight:700, color:'var(--text)', marginBottom:8 }}>Vercel ga deploy uchun:</div>
          <div>1. <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{color:'#7C3AED'}}>supabase.com</a> → New project</div>
          <div>2. SQL Editor → <code style={{fontSize:11, background:'var(--surface)', padding:'1px 5px', borderRadius:4}}>SUPABASE_SETUP.sql</code> ni run qiling</div>
          <div>3. Settings → API → URL va anon key ni oling</div>
          <div>4. Vercel → Environment Variables:</div>
          <code style={{ display:'block', marginTop:6, padding:'10px 12px', background:'var(--surface)', borderRadius:8, fontSize:11, color:'#7C3AED', border:'1px solid var(--border)', lineHeight:1.8 }}>
            VITE_SUPABASE_URL = https://xxx.supabase.co{'\n'}
            VITE_SUPABASE_ANON_KEY = eyJ...
          </code>
          <div style={{ marginTop:10 }}>5. Redeploy → tayyor!</div>
        </div>
        <button onClick={onClose} style={{ width:'100%', marginTop:16, padding:'10px', background:'#7C3AED', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>Yopish</button>
      </div>
    </div>
  )
}
