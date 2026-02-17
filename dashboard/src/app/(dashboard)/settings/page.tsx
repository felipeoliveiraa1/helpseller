'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Settings, Building2, Loader2, User, Mail, Shield, Briefcase, CreditCard, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type OrgRow = Database['public']['Tables']['organizations']['Row']
type OrgUpdate = Database['public']['Tables']['organizations']['Update']

const NEON_PINK = '#ff007a'
const CARD_STYLE = { backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.08)' }
const INPUT_CLASS =
  'flex h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff007a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1e1e] transition-shadow'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  SELLER: 'Vendedor',
  member: 'Membro',
}

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Grátis',
  STARTER: 'Starter',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
  Gratis: 'Grátis',
  Pro: 'Pro',
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState<{
    full_name: string | null
    email: string | null
    role: string
    organization_id: string | null
  } | null>(null)
  const [organization, setOrganization] = useState<OrgRow | null>(null)
  const [organizationName, setOrganizationName] = useState<string>('')
  const [organizationPlan, setOrganizationPlan] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [form, setForm] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
  })
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    loadProfileAndOrg()
  }, [])

  async function loadProfileAndOrg() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, role, organization_id')
        .eq('id', user.id)
        .single()
      const profileRow = profileData as { full_name: string | null; email: string | null; role: string; organization_id: string | null } | null
      setProfile(profileRow ?? {
        full_name: user.user_metadata?.full_name ?? null,
        email: user.email ?? null,
        role: 'SELLER',
        organization_id: null,
      })
      const orgId = profileRow?.organization_id ?? null
      if (!orgId) {
        setOrganization(null)
        setOrganizationName('')
        setOrganizationPlan('')
        setLoading(false)
        return
      }
      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()
      if (error) {
        setOrganization(null)
        setOrganizationName('')
        setOrganizationPlan('')
        setLoading(false)
        return
      }
      const org = orgData as OrgRow & { plan?: string }
      setOrganization(org)
      setOrganizationName(org.name ?? '')
      setOrganizationPlan(org.plan ?? 'FREE')
      setForm({
        name: org.name ?? '',
        document: org.document ?? '',
        phone: org.phone ?? '',
        email: org.email ?? '',
        address: org.address ?? '',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!organization || !profile?.organization_id) return
    setSaving(true)
    try {
      const update: OrgUpdate = {
        name: form.name.trim() || organization.name,
        document: form.document.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
      }
      const { error } = await supabase
        .from('organizations')
        .update(update)
        .eq('id', organization.id)
      if (error) throw error
      toast.success('Dados da organização salvos.')
      await loadProfileAndOrg()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    const { newPassword, confirmPassword } = passwordForm
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    setPasswordSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Senha alterada com sucesso.')
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar senha.')
    } finally {
      setPasswordSaving(false)
    }
  }

  if (!mounted || loading) {
    return (
      <>
        <DashboardHeader title="Configurações" />
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      </>
    )
  }

  const isManager = profile?.role === 'MANAGER' || profile?.role === 'ADMIN'
  const hasOrg = !!organization

  return (
    <>
      <DashboardHeader title="Configurações" />
      <div className="space-y-8 max-w-3xl">
        {/* Seção: Perfil do usuário */}
        <section className="rounded-2xl border p-6 sm:p-8" style={CARD_STYLE}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255, 0, 122, 0.15)' }}>
              <User className="w-6 h-6" style={{ color: NEON_PINK }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Perfil do usuário</h2>
              <p className="text-sm text-gray-500">Suas informações de acesso e função</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Nome
              </label>
              <div className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white flex items-center">
                {profile?.full_name || '—'}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> E-mail
              </label>
              <div className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white flex items-center">
                {profile?.email || '—'}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> Função
              </label>
              <div className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white flex items-center">
                {ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? '—'}
              </div>
            </div>
            {organizationName && (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Organização
                </label>
                <div className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white flex items-center">
                  {organizationName}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Seção: Plano */}
        <section className="rounded-2xl border p-6 sm:p-8" style={CARD_STYLE}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Plano</h2>
              <p className="text-sm text-gray-500">Plano atual da sua organização</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Plano atual</label>
            <div className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white flex items-center font-medium">
              {hasOrg ? (PLAN_LABELS[organizationPlan] ?? organizationPlan ?? 'Grátis') : '—'}
            </div>
            {!hasOrg && (
              <p className="text-xs text-gray-500 mt-1">Vincule-se a uma organização para ver o plano.</p>
            )}
          </div>
        </section>

        {/* Seção: Alteração de senha */}
        <section className="rounded-2xl border p-6 sm:p-8" style={CARD_STYLE}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255, 0, 122, 0.15)' }}>
              <Lock className="w-6 h-6" style={{ color: NEON_PINK }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Alteração de senha</h2>
              <p className="text-sm text-gray-500">Defina uma nova senha para acessar sua conta</p>
            </div>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-md">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Nova senha</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                className={INPUT_CLASS}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Confirmar nova senha</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className={INPUT_CLASS}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
              />
            </div>
            <div className="pt-1">
              <button
                type="submit"
                disabled={passwordSaving}
                className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: NEON_PINK }}
              >
                {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Alterar senha
              </button>
            </div>
          </form>
        </section>

        {/* Seção: Dados da organização (só para manager com org) */}
        {isManager && hasOrg && (
          <section className="rounded-2xl border p-6 sm:p-8" style={CARD_STYLE}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Dados da organização</h2>
                <p className="text-sm text-gray-500">Informações da empresa usadas em cadastros e contratos</p>
              </div>
            </div>
            <form onSubmit={handleSaveOrg} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Nome da empresa</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={INPUT_CLASS}
                    placeholder="Razão social ou nome fantasia"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">CNPJ / CPF</label>
                  <input
                    type="text"
                    value={form.document}
                    onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))}
                    className={INPUT_CLASS}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Telefone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className={INPUT_CLASS}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">E-mail da empresa</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={INPUT_CLASS}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Endereço</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className={INPUT_CLASS}
                  placeholder="Rua, número, bairro, cidade, CEP"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                  style={{ backgroundColor: NEON_PINK }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Salvar dados da organização
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Sem organização ou não é manager */}
        {(!hasOrg || !isManager) && (
          <section className="rounded-2xl border p-6 sm:p-8 text-center" style={CARD_STYLE}>
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Settings className="w-7 h-7 text-gray-500" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Configurações</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {!hasOrg
                ? 'Sua conta não está vinculada a uma organização. Entre em contato com o administrador para vincular sua conta.'
                : 'Outras opções de configuração em breve.'}
            </p>
          </section>
        )}
      </div>
    </>
  )
}
