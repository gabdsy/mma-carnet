type AuthErrorLike = { code?: string; status?: number } | null | undefined

// Traduit les erreurs Supabase Auth en messages courts et compréhensibles.
export function authErrorMessage(error: AuthErrorLike): string | null {
  if (!error) return null

  switch (error.code) {
    case 'invalid_credentials':
      return 'E-mail ou mot de passe incorrect.'
    case 'email_not_confirmed':
      return "Ce compte n'est pas encore activé. Demande à l'admin de le confirmer."
    case 'user_banned':
      return "Ce compte est désactivé. Contacte l'admin."
    case 'over_request_rate_limit':
      return 'Trop de tentatives. Réessaie dans quelques minutes.'
  }

  if (error.status === 429) return 'Trop de tentatives. Réessaie dans quelques minutes.'
  return 'Une erreur est survenue. Vérifie ta connexion et réessaie.'
}
