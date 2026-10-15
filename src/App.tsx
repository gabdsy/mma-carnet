export default function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-4 py-6">
      <header>
        <p className="text-sm uppercase tracking-widest text-red-500">Carnet MMA</p>
        <h1 className="mt-2 text-3xl font-bold">Bonjour 👊</h1>
        <p className="mt-3 text-neutral-400">
          L'application est en ligne. Prochaine étape : la connexion.
        </p>
      </header>

      <button
        type="button"
        disabled
        className="min-h-14 w-full rounded-2xl bg-red-600 text-lg font-semibold disabled:opacity-50"
      >
        Nouvelle séance (bientôt)
      </button>
    </main>
  )
}
