import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './authErrorMessage'

describe('authErrorMessage', () => {
  it("ne renvoie rien quand il n'y a pas d'erreur", () => {
    expect(authErrorMessage(null)).toBeNull()
  })

  it('signale des identifiants incorrects', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', status: 400 })).toMatch(
      /mot de passe incorrect/,
    )
  })

  it('signale un compte non confirmé', () => {
    expect(authErrorMessage({ code: 'email_not_confirmed', status: 400 })).toMatch(/pas encore activé/)
  })

  it('signale une limite de tentatives, même sans code connu', () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/Trop de tentatives/)
  })

  it('a un message par défaut', () => {
    expect(authErrorMessage({ code: 'inconnu', status: 500 })).toMatch(/erreur est survenue/)
  })
})
