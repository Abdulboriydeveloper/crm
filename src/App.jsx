import { useState, useEffect, useRef } from 'react'
import LoginPage, { USERS } from './components/LoginPage.jsx'
import Header from './components/Header.jsx'
import Board from './components/Board.jsx'
import AdminBoard from './components/AdminBoard.jsx'
import LeadModal from './components/LeadModal.jsx'
import SetupModal from './components/SetupModal.jsx'
import { getLeads, updateLeadStage, assignLead, subscribeLeads } from './supabase.js'

const USER_KEY = 'nargiza_user_v2'

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSetup, setShowSetup] = useState(false)
  const subRef = useRef(null)

  const handleLogin = (u) => {
    setUser(u)
    sessionStorage.setItem(USER_KEY, JSON.stringify(u))
  }
  const handleLogout = () => {
    setUser(null); setLeads([])
    sessionStorage.removeItem(USER_KEY)
    subRef.current?.unsubscribe()
  }

  const fetchLeads = async () => {
    setLoading(true); setError('')
    try {
      const all = await getLeads()
      setLeads(all)
    } catch(e) {
      setError('Supabase ulanish xatosi: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // Real-time subscription
  useEffect(() => {
    if (!user) return
    fetchLeads()

    // Real-time: yangi lid qo'shilsa, o'zgarsa, o'chsa — avtomatik yangilanadi
    subRef.current = subscribeLeads(
      (newLead) => setLeads(prev => [newLead, ...prev]),
      (updated) => setLeads(prev => prev.map(l => l.id === updated.id ? updated : l)),
      (deleted) => setLeads(prev => prev.filter(l => l.id !== deleted.id))
    )
    return () => subRef.current?.unsubscribe()
  }, [user])

  // Menejer: bosqich o'zgartirish
  const handleMoveCard = async (leadId, stage) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage } : l))
    try {
      await updateLeadStage(leadId, stage)
    } catch(e) {
      setError('Saqlashda xato: ' + e.message)
      fetchLeads() // rollback
    }
  }

  // Admin: menejergа berish
  const handleAssignLead = async (leadId, managerId) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assigned_to: managerId } : l))
    try {
      await assignLead(leadId, managerId)
    } catch(e) {
      setError('Berish xatosi: ' + e.message)
      fetchLeads()
    }
  }

  // Lid yangilanganda modal ni ham yangilash
  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find(l => l.id === selectedLead.id)
      if (updated) setSelectedLead(updated)
    }
  }, [leads])

  if (!user) return <LoginPage onLogin={handleLogin} />

  // Filterlash: menejerlar faqat o'zlariga berilganlarni ko'radi
  const visibleLeads = user.role === 'admin'
    ? leads
    : leads.filter(l => l.assigned_to === user.id)

  const filtered = searchQuery
    ? visibleLeads.filter(l =>
        l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone?.includes(searchQuery)
      )
    : visibleLeads

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <Header
        loading={loading}
        searchQuery={searchQuery} onSearch={setSearchQuery}
        onRefresh={fetchLeads}
        onSettings={() => setShowSetup(true)}
        totalLeads={filtered.length}
        user={user} onLogout={handleLogout}
        isAdmin={user.role === 'admin'}
      />

      {error && (
        <div style={{
          margin:'0 16px 8px', padding:'10px 14px',
          background:'#FEF3C7', border:'1px solid #FCD34D',
          borderRadius:8, color:'#92400E', fontSize:13, flexShrink:0,
          display:'flex', alignItems:'center', gap:8
        }}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#92400E', fontSize:18 }}>×</button>
        </div>
      )}

      {user.role === 'admin' ? (
        <AdminBoard
          leads={filtered}
          loading={loading}
          onAssignLead={handleAssignLead}
          onSelectLead={setSelectedLead}
          managers={USERS.filter(u => u.role === 'manager')}
        />
      ) : (
        <Board
          leads={filtered}
          loading={loading}
          onMoveCard={handleMoveCard}
          onSelectLead={setSelectedLead}
        />
      )}

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          user={user}
          onClose={() => setSelectedLead(null)}
          onMove={handleMoveCard}
          onAssign={handleAssignLead}
          managers={USERS.filter(u => u.role === 'manager')}
        />
      )}

      {showSetup && <SetupModal onClose={() => setShowSetup(false)} />}
    </div>
  )
}
