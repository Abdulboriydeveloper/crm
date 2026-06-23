import { useState, useEffect, useCallback, useRef } from 'react'
import Board from './components/Board.jsx'
import Header from './components/Header.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import LeadModal from './components/LeadModal.jsx'

const WEBAPP_KEY = 'nargiza_webapp_url'
const REFRESH_INTERVAL = 30000

// Lokal (dev) da — to'g'ridan Apps Script ga
// Vercel (prod) da — /api/sheets proxy orqali
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const DIRECT_URL = localStorage.getItem(WEBAPP_KEY) || ''

async function apiRequest(params) {
  const searchParams = new URLSearchParams({ ...params, t: Date.now() })

  if (IS_DEV && DIRECT_URL) {
    // Lokal: to'g'ridan Apps Script ga, redirect follow
    const res = await fetch(`${DIRECT_URL}?${searchParams}`, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
    })
    const text = await res.text()
    if (text.trim().startsWith('{')) return JSON.parse(text)
    // 302 redirect — no-cors bilan yuborish (read emas, yozish uchun)
    if (params.action !== 'list') {
      await fetch(`${DIRECT_URL}?${searchParams}`, { method: 'GET', mode: 'no-cors' })
      return { status: 'ok', fallback: true }
    }
    throw new Error('Apps Script redirect qaytardi. Yangi version deploy qiling.')
  }

  // Vercel prod: proxy orqali
  const res = await fetch(`/api/sheets?${searchParams}`, {
    method: 'GET',
    cache: 'no-store',
  })
  return res.json()
}

export default function App() {
  const [webAppUrl, setWebAppUrl] = useState(() => localStorage.getItem(WEBAPP_KEY) || '')
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(!localStorage.getItem(WEBAPP_KEY))
  const [selectedLead, setSelectedLead] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef(null)
  // Pending moves: refresh bo'lsa ham saqlanadi
  const pendingMoves = useRef({})

  const fetchLeads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const data = await apiRequest({ action: 'list' })
      if (data.status === 'ok') {
        const raw = data.leads || []
        // Pending moves ni ustidan yoz
        const merged = raw.map(l => {
          const phone = getPhone(l.value)
          const pending = phone && pendingMoves.current[cleanPhone(phone)]
          return pending ? { ...l, stage: pending } : l
        })
        setLeads(merged)
        setLastUpdated(new Date())
        // Sheets da ham o'zgargan bo'lsa pending dan o'chir
        raw.forEach(l => {
          const phone = cleanPhone(getPhone(l.value))
          if (phone && pendingMoves.current[phone] === l.stage) {
            delete pendingMoves.current[phone]
          }
        })
      } else {
        setError(data.message || 'Xato yuz berdi')
      }
    } catch (e) {
      if (!silent) setError('Server bilan ulanishda xato: ' + e.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchLeads(true), REFRESH_INTERVAL)
    }
    return () => clearInterval(intervalRef.current)
  }, [autoRefresh, fetchLeads])

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleSaveUrl = (url) => {
    setWebAppUrl(url)
    localStorage.setItem(WEBAPP_KEY, url)
    setShowSettings(false)
    // Sahifani qayta yuklash — DIRECT_URL const ni yangilash uchun
    window.location.reload()
  }

  const handleMoveCard = async (phone, stage) => {
    const clean = cleanPhone(phone)
    // 1. Pending ga yoz
    pendingMoves.current[clean] = stage
    // 2. UI ni darhol yangilash
    setLeads(prev => prev.map(l => {
      const p = cleanPhone(getPhone(l.value))
      return p && (p === clean || p.endsWith(clean.slice(-9))) ? { ...l, stage } : l
    }))
    // 3. Proxy orqali Sheets ga yubor
    try {
      const res = await apiRequest({ action: 'move', phone, stage })
      if (res.status === 'ok') {
        delete pendingMoves.current[clean]
      }
    } catch (e) {
      console.warn('Move xatosi:', e.message)
    }
  }

  const filteredLeads = searchQuery
    ? leads.filter(l => l.value?.toLowerCase().includes(searchQuery.toLowerCase()))
    : leads

  // Lokal dev da settings modal kerak (env var yo'q)
  const needsSetup = !webAppUrl && import.meta.env.DEV

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <Header
        loading={loading}
        lastUpdated={lastUpdated}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onRefresh={() => fetchLeads()}
        onSettings={() => setShowSettings(true)}
        totalLeads={leads.length}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(v => !v)}
      />

      {error && (
        <div style={{
          margin:'0 16px 8px', padding:'10px 14px',
          background:'#FEF3C7', border:'1px solid #FCD34D',
          borderRadius:8, color:'#92400E', fontSize:13, flexShrink:0,
          display:'flex', alignItems:'center', gap:8
        }}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={{
            marginLeft:'auto', background:'none', border:'none',
            cursor:'pointer', color:'#92400E', fontSize:18
          }}>×</button>
        </div>
      )}

      <Board
        leads={filteredLeads}
        loading={loading}
        onMoveCard={handleMoveCard}
        onSelectLead={setSelectedLead}
      />

      {(showSettings || needsSetup) && (
        <SettingsModal
          currentUrl={webAppUrl}
          onSave={handleSaveUrl}
          onClose={() => !needsSetup && setShowSettings(false)}
        />
      )}
      {selectedLead && (
        <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} onMove={handleMoveCard} />
      )}
    </div>
  )
}

function getPhone(val) {
  for (const l of (val || '').split('\n')) {
    if (l.startsWith('Raqam:')) return l.replace('Raqam:', '').trim()
  }
  return ''
}
function cleanPhone(p) {
  return (p || '').replace(/[\s+\-()]/g, '')
}
