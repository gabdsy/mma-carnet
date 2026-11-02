# CLAUDE.md — carnet d'entraînement MMA

## Contexte

Application web personnelle pour structurer un entraînement de MMA (MMA, grappling,
boxe, ~5 séances par semaine) en vue d'un combat en février-mars 2027.
1 utilisateur principal + 1 à 2 amis. Le propriétaire débute en développement :
**explique chaque choix simplement et avance une fonctionnalité à la fois.**

Boucle centrale : **Leçon (vidéo + résumé) → Drill → Séance réalisée → Bilan / ajustement.**
Le plan détaillé (modèle de données, étapes) est dans `docs/PLAN.md`. Mets-le à jour
quand une décision change.

## Stack

- Vite + React + TypeScript (strict) — application monopage
- Tailwind CSS, React Router
- Supabase : Postgres, Auth (e-mail + mot de passe, aucun e-mail envoyé), Row Level Security
- vite-plugin-pwa (manifest + service worker)
- Vercel (hébergement statique, déploiement à chaque push sur `main`)
- Vitest pour la logique pure (dates, validation, parsing du contenu)

N'ajoute pas de dépendance sans l'annoncer et expliquer pourquoi.

## Commandes

```
npm run dev        # serveur local
npm run build      # build de production
npm run test       # Vitest
npm run lint       # ESLint + vérification TypeScript
npm run icons      # régénère les icônes PWA depuis public/logo.svg
npm run import     # content/*.md -> Supabase (lessons, drills) — à venir
```

## Arborescence

- `content/sources/` — résumés bruts de vidéos YouTube. **Ne jamais modifier.**
  Les leçons de `content/lessons/` en sont une version nettoyée et relue par l'utilisateur.
  Horodatages de chapitres repris des résumés : à vérifier sur la vidéo.
- `content/lessons/`, `content/drills/` — un fichier Markdown + frontmatter YAML par élément.
  Formats décrits dans `docs/PLAN.md`.
- `scripts/import-content.ts` — valide le frontmatter (zod) et fait un upsert par `slug`.
- `supabase/migrations/` — un fichier SQL par changement de schéma, jamais modifié après coup.
- `src/features/<domaine>/` — pages et composants propres à un domaine
  (auth, lessons, drills, journal, calendar).
- `src/components/` — composants réutilisables. `src/lib/` — client Supabase, utilitaires.

## Conventions

- Interface **en français**. Code (variables, fonctions, tables, colonnes) **en anglais**.
- Commits en français, préfixés : `feat:`, `fix:`, `content:`, `chore:`, `docs:`.
- Base de données :
  - clés primaires `uuid` ; `created_at`, `updated_at` sur chaque table ;
  - listes fermées en `text` + contrainte `check`, pas d'`enum` Postgres ;
  - **RLS activée sur chaque table, sans exception.**
    Données perso : `user_id = auth.uid()` pour select/insert/update/delete.
    Contenu partagé (lessons, drills…) : lecture pour `authenticated`. Les leçons et les
    drills `source = content` ne s'écrivent que via le script d'import. Exception : un
    utilisateur peut créer des drills `source = user`, modifiables par leur seul auteur.
  - Types TypeScript générés depuis le schéma (`supabase gen types`), pas écrits à la main.
- Vidéos : iframe YouTube officielle (`youtube-nocookie.com/embed/<id>`), liens horodatés
  par `start` / API IFrame. **Ne jamais télécharger de vidéo, de transcription ou de miniature.**

## Mobile d'abord (utilisation en salle)

- Appareil de référence : **iPhone 13 mini** (375 × 812 px, Safari / PWA iOS).
  Conçois pour 375 px de large, puis élargis. Respecte l'encoche et la barre d'accueil
  (`viewport-fit=cover`, `env(safe-area-inset-*)`). Champs de saisie en ≥ 16 px
  (sinon iOS zoome automatiquement).
- Cibles tactiles ≥ 48 px, boutons principaux en bas de l'écran (atteignables au pouce).
- Saisie d'une séance **en moins de 30 secondes** : valeurs par défaut (date du jour,
  type et durée du créneau prévu), sélecteurs à boutons plutôt que listes déroulantes,
  RPE en 10 boutons, notes facultatives.
- Pas de survol (hover) indispensable, contraste lisible sous un éclairage de salle.

## Sécurité et secrets

- Aucun secret dans le code ni dans Git. `.env` et `.env.*` sont dans `.gitignore` ;
  seul `.env.example` (noms des variables, sans valeurs) est commité.
- Seules les variables préfixées `VITE_` arrivent dans le navigateur :
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. **La clé `service_role` ne porte jamais
  le préfixe `VITE_`** et n'est utilisée que par `scripts/import-content.ts`, en local.
- Inscriptions publiques et confirmation par e-mail désactivées dans Supabase : l'admin crée
  les comptes à la main (Authentication → Users). Aucun envoi d'e-mail (pas de SMTP).

## Règles de travail

1. Une seule fonctionnalité à la fois, dans l'ordre de `docs/PLAN.md`.
2. Avant de coder : dire ce qui va être fait et quels fichiers changent.
3. Après : dire comment vérifier (sur ordinateur et sur téléphone), lancer lint + tests.
4. Un commit par fonctionnalité qui marche. Ne jamais commiter du code qui ne build pas.
5. Expliquer les notions nouvelles en une ou deux phrases, sans jargon inutile.
6. En cas d'ambiguïté sur le métier (MMA) ou l'usage, poser la question plutôt que deviner.

## Hors périmètre du MVP (ne pas coder, garder le modèle compatible)

Sparring log par round, constructeur de combos (garde + jambe utilisée), timer de rounds,
suivi du poids, compte à rebours du combat, mode hors-ligne.
Les tables prévues sont listées dans `docs/PLAN.md` § « Déjà prévu pour plus tard ».
