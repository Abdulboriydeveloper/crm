import { useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

export function usePresence(user) {
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!user) return

    const update = async () => {
      await supabase.from('presence').upsert({
        user_id: user.id,
        user_name: user.name,
        last_seen: new Date().toISOString()
      }, { onConflict: 'user_id' })
    }

    update()
    intervalRef.current = setInterval(update, 30000)

    const handleVisibility = () => { if (!document.hidden) update() }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user])
}

export async function getOnlineUsers() {
  const since = new Date(Date.now() - 60000).toISOString()
  const { data } = await supabase
    .from('presence')
    .select('*')
    .gte('last_seen', since)
  return data || []
}