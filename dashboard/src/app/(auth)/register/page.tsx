'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useTheme } from '@/components/theme-provider'

const INPUT_CLASS =
  'mt-1 block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, company_name: orgName },
      },
    })
    if (error) {
      toast.error(error.message)
    } else if (data.user && !data.session) {
      toast.success('Conta criada! Verifique seu email para confirmar.')
      router.push('/login')
    } else {
      toast.success('Conta criada com sucesso!')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen">
      {/* Form side */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="p-6 flex justify-end">
          <button
            type="button"
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
          >
            <span className="material-icons-outlined block dark:hidden">dark_mode</span>
            <span className="material-icons-outlined hidden dark:block">light_mode</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="text-2xl font-bold tracking-tight">CloseIA</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                Criar conta
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                Comece a usar o CloseIA agora
              </p>
              <form className="space-y-5" onSubmit={handleRegister}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nome da empresa
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Sua empresa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-opacity"
                >
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>
              <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Já tem uma conta?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:opacity-90 transition-opacity"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Right side - branding */}
      <div
        className="hidden lg:flex lg:w-1/2 rounded-l-3xl overflow-hidden relative bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: 'url(/bg2.jpg)' }}
      >
        <div className="absolute inset-0 bg-white/30 pointer-events-none" aria-hidden />
        <div className="relative z-10 flex flex-col justify-center p-12 max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <span className="text-3xl font-bold tracking-tight text-slate-900">CloseIA</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Junte-se a nós
          </h2>
          <p className="text-slate-700 text-lg">
            Milhares de vendedores já batem meta com coaching em tempo real.
          </p>
        </div>
      </div>
    </div>
  )
}
