import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { useSession } from './features/auth/useSession'
import LoginPage from './features/auth/LoginPage'

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <p className="text-red-400">
          Configuration manquante : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (voir .env.example).
        </p>
      </Screen>
    )
  }
  return <AuthGate />
}

function AuthGate() {
  const session = useSession()

  if (session === undefined) {
    return (
      <Screen>
        <p className="text-neutral-400">Chargement…</p>
      </Screen>
    )
  }
  if (session === null) return <LoginPage />
  return <HomePage session={session} />
}

function HomePage({ session }: { session: Session }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-4 py-6">
      <header>
        <p className="text-sm uppercase tracking-widest text-red-500">Carnet MMA</p>
        <h1 className="mt-2 text-3xl font-bold">Bonjour 👊</h1>
        <p className="mt-3 text-neutral-400">Connecté : {session.user.email}</p>
      </header>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled
          className="min-h-14 w-full rounded-2xl bg-red-600 text-lg font-semibold disabled:opacity-50"
        >
          Nouvelle séance (bientôt)
        </button>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="min-h-12 w-full text-neutral-400"
        >
          Se déconnecter
        </button>
      </div>
    </main>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-dvh max-w-md items-center px-4">{children}</main>
}
