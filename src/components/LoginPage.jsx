import { useState } from 'react'

export const USERS = [
  { id:'admin',    name:'Admin',     username:'admin',    password:'admin123', role:'admin',   color:'#7C3AED', initials:'AD' },
  { id:'manager1', name:'Menejer 1', username:'menejer1', password:'parol123', role:'manager', color:'#2563EB', initials:'M1' },
  { id:'manager2', name:'Menejer 2', username:'menejer2', password:'parol456', role:'manager', color:'#DC2626', initials:'M2' },
]

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e?.preventDefault()
    setError(''); setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    const user = USERS.find(u => u.username === username.trim().toLowerCase() && u.password === password)
    if (user) onLogin(user)
    else setError("Noto'g'ri ism yoki parol")
    setLoading(false)
  }

  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:16 }}>
      <div style={{ background:'var(--surface)', borderRadius:20, padding:32, width:'100%', maxWidth:380, border:'1px solid var(--border)', boxShadow:'0 8px 40px rgba(0,0,0,0.12)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#7C3AED,#C026D3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 12px' }}>💄</div>
          <div style={{ fontSize:18, fontWeight:700 }}>Nargiza CRM</div>
          <div style={{ fontSize:13, color:'var(--text2)', marginTop:3 }}>Hisobingizga kiring</div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>Foydalanuvchi nomi</label>
            <input type="text" placeholder="admin / menejer1 / menejer2" value={username}
              onChange={e => { setUsername(e.target.value); setError('') }} autoFocus
              style={{ width:'100%', padding:'10px 12px', border:`1.5px solid ${error?'#EF4444':'var(--border)'}`, borderRadius:10, background:'var(--surface2)', color:'var(--text)', fontSize:14, outline:'none' }}
            />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>Parol</label>
            <div style={{ position:'relative' }}>
              <input type={showPass?'text':'password'} placeholder="••••••••" value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                style={{ width:'100%', padding:'10px 40px 10px 12px', border:`1.5px solid ${error?'#EF4444':'var(--border)'}`, borderRadius:10, background:'var(--surface2)', color:'var(--text)', fontSize:14, outline:'none', boxSizing:'border-box' }}
              />
              <button type="button" onClick={() => setShowPass(v=>!v)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16 }}>{showPass?'🙈':'👁'}</button>
            </div>
          </div>
          {error && <div style={{ color:'#DC2626', fontSize:13, marginBottom:14, background:'#FEE2E2', padding:'8px 12px', borderRadius:8, textAlign:'center' }}>⚠️ {error}</div>}
          <button type="submit" disabled={loading||!username||!password} style={{ width:'100%', padding:'12px', background:!username||!password?'var(--border2)':'#7C3AED', color:!username||!password?'var(--text3)':'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>
            {loading ? '...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  )
}
