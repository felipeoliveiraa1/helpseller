'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Building2, Loader2 } from 'lucide-react'

const NEON_PINK = '#ff007a'
const CARD_STYLE = { backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.05)' }
const INPUT_CLASS =
  'flex h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff007a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1e1e]'

function slugFromNameAndUserId(name: string, userId: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const suffix = userId.replace(/-/g, '').slice(0, 8)
  return base ? `${base}-${suffix}` : `org-${suffix}`
}

interface OrgNullFormProps {
  onSuccess: () => void
}

export function OrgNullForm({ onSuccess }: OrgNullFormProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
  })
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = form.name.trim()
    if (!trimmedName) {
      toast.error('Informe o nome da empresa.')
      return
    }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Sessão inválida.')
        setSaving(false)
        return
      }
      const slug = slugFromNameAndUserId(trimmedName, user.id)
      const { data: newOrg, error: insertError } = await supabase
        .from('organizations')
        .insert({
          name: trimmedName,
          slug,
          document: form.document.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
        })
        .select('id')
        .single()
      if (insertError) throw insertError
      if (!newOrg?.id) {
        toast.error('Organização não foi criada.')
        setSaving(false)
        return
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ organization_id: newOrg.id })
        .eq('id', user.id)
      if (updateError) throw updateError
      toast.success('Organização cadastrada. Você já pode usar o dashboard.')
      onSuccess()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="rounded-[24px] border p-6" style={CARD_STYLE}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Cadastre sua organização</h2>
            <p className="text-sm text-gray-500">
              Preencha os dados da empresa para continuar usando o dashboard.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nome da empresa *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={INPUT_CLASS}
              placeholder="Sua empresa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">CNPJ / CPF</label>
            <input
              type="text"
              value={form.document}
              onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))}
              className={INPUT_CLASS}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Telefone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={INPUT_CLASS}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">E-mail da empresa</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={INPUT_CLASS}
              placeholder="contato@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Endereço</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className={INPUT_CLASS}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: NEON_PINK }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Salvar e continuar
          </button>
        </form>
      </div>
    </div>
  )
}
