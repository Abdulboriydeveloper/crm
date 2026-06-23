import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase env vars topilmadi. .env.local faylni tekshiring.')
}

export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_KEY || ''
)

// ── Leads ──────────────────────────────────────────────────────

export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createLead({ name, phone, stage = 'Yangi lid', assigned_to = null }) {
  const { data, error } = await supabase
    .from('leads')
    .insert([{ name, phone, stage, assigned_to }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLeadStage(id, stage) {
  const { data, error } = await supabase
    .from('leads')
    .update({ stage })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function assignLead(id, managerId) {
  const { data, error } = await supabase
    .from('leads')
    .update({ assigned_to: managerId })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLead(id) {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}

// ── Notes ──────────────────────────────────────────────────────

export async function getNotes(leadId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addNote(leadId, text, author) {
  const { data, error } = await supabase
    .from('notes')
    .insert([{ lead_id: leadId, text, author }])
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Real-time subscription ─────────────────────────────────────

export function subscribeLeads(onInsert, onUpdate, onDelete) {
  return supabase
    .channel('leads-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, p => onInsert?.(p.new))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, p => onUpdate?.(p.new))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, p => onDelete?.(p.old))
    .subscribe()
}
