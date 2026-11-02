import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { authErrorMessage } from './authErrorMessage'

const inputClass =
  'mt-2 min-h-14 w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 text-lg outline-none focus:border-red-500'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    // Aucun e-mail envoyé : les comptes sont créés à la main dans Supabase.
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)
    // En cas de succès, useSession détecte la nouvelle session et l'app change d'écran.
    if (error) setError(authErrorMessage(error))
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      <p className="text-sm uppercase tracking-widest text-red-500">Carnet MMA</p>
      <h1 className="mt-2 text-3xl font-bold">Connexion</h1>

      <form onSubmit={signIn} className="mt-8 flex flex-1 flex-col justify-between gap-6">
        <div className="flex flex-col gap-5">
          <label className="block text-neutral-300">
            E-mail
            <input
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block text-neutral-300">
            Mot de passe
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                // Permet au trousseau iCloud de proposer et mémoriser le mot de passe.
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-24`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute bottom-1 right-1 min-h-12 px-3 text-sm text-neutral-400"
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </label>

          <p className="text-sm text-neutral-500">
            Pas de compte ? Demande à l'admin de t'en créer un.
          </p>
        </div>

        <div>
          {error && <p className="mb-4 text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="min-h-14 w-full rounded-2xl bg-red-600 text-lg font-semibold active:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </div>
      </form>
    </main>
  )
}
