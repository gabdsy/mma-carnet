# Plan du projet — carnet d'entraînement MMA

> Statut : plan validé le 2026-10-15. Dossier du projet : `Documents\mma-carnet`.

## 0. Décisions prises

| Sujet | Décision |
|---|---|
| Stack | Vite + React + TS + Tailwind + Supabase + Vercel |
| Garde de l'utilisateur principal | orthodoxe naturel, boxe souvent en southpaw, switch beaucoup |
| Filtres « garde » | deux filtres : **ma garde** (orthodoxe / southpaw / switch) et **face à** (garde ouverte / garde fermée) |
| Drills | 10-15 proposés en Markdown, validés par l'utilisateur ; **ajout manuel possible depuis l'appli** |
| Bilan | les deux : 2 champs facultatifs après chaque séance + un bilan hebdomadaire |
| Types de séance | mma / grappling / boxe / sparring / physique / autre |
| Créneaux récurrents | fixes pour tous les types sauf physique et autre (saisis au fil de l'eau) |
| Connexion | e-mail + mot de passe, **aucun e-mail envoyé** (pas de SMTP personnalisé) ; inscriptions et confirmation par e-mail désactivées ; l'admin crée les comptes dans Authentication → Users |
| Appareil cible | iPhone 13 mini (375 × 812 px, encoche → `viewport-fit=cover` + `safe-area-inset`) |
| Leçon en anglais | traduite en français (demi-garde) |

## 1. La boucle centrale

```
Leçon (vidéo + résumé) ──► Drill ──► Séance réalisée ──► Bilan / ajustement
        ▲                                                        │
        └────────────── le bilan choisit le prochain focus ◄─────┘
```

Chaque table du modèle de données sert un maillon de cette boucle.

## 2. Architecture

```
Téléphone (PWA installée)
   │  HTTPS
   ▼
Application web (React, fichiers statiques hébergés sur Vercel)
   │  client Supabase (clé publique "anon")
   ▼
Supabase : Auth (connexion) + Postgres (données) + RLS (qui voit quoi)
   ▲
   │  clé "service_role" (secrète, uniquement sur ton PC)
Script d'import : content/*.md ──► tables lessons / drills
```

- **L'application ne contient aucun secret.** La clé `anon` est publique par
  conception. La sécurité est assurée par la RLS dans la base.
- **Le contenu (leçons, drills) se modifie dans les fichiers Markdown**, puis
  `npm run import` le pousse en base. L'application se contente de le lire.

### Stack recommandée

| Brique | Choix | Pourquoi |
|---|---|---|
| Interface | **Vite + React + TypeScript** (application monopage) | Moins de notions qu'avec Next.js (pas de composants serveur/client) ; tout est derrière une connexion, donc le rendu serveur et le SEO n'apportent rien ; le futur mode hors-ligne est bien plus simple dans une application monopage. |
| Style | Tailwind CSS | Rapide pour du mobile-first, pas de fichiers CSS à maintenir. |
| Routage | React Router | Standard, bien documenté. |
| Données | Supabase (Postgres + Auth + RLS) | Gratuit à 1-3 utilisateurs, la RLS règle la confidentialité sans écrire de serveur. |
| PWA | vite-plugin-pwa | Manifest + service worker générés ; base du mode hors-ligne futur. |
| Hébergement | Vercel (site statique) | Déploiement automatique à chaque `git push`. |
| Tests | Vitest (logique) + vérification manuelle sur téléphone | Suffisant à cette échelle. |

Next.js reste possible (voir questions). Supabase et Vercel ne changent pas.

## 3. Modèle de données

Conventions : identifiants `uuid` (permettent de créer une séance hors-ligne
plus tard sans collision), listes fermées en `text` + contrainte `check`
(plus simple à faire évoluer qu'un `enum` Postgres), `created_at` /
`updated_at` partout.

### Contenu partagé (lecture pour tout utilisateur connecté, écriture par le script)

**lessons**
| colonne | type | note |
|---|---|---|
| id | uuid PK | |
| slug | text unique | clé stable utilisée par l'import (upsert) |
| title | text | titre français |
| original_title | text | titre YouTube |
| youtube_id | text | ex. `K30fUFvwrHc` |
| channel | text | ex. Connells Combat |
| subject | text | le « Sujet » des sources |
| body_md | text | déroulement complet |
| key_points | text[] | « Points clés à retenir » |
| category | text check | striking / lutte / grappling / tactique |
| distances | text[] | longue / moyenne / clinch-cage / sol |
| stance | text check | garde de celui qui exécute : orthodoxe / southpaw / switch / toutes |
| matchup | text check | face à : garde-ouverte / garde-fermee / toutes |
| tags | text[] | jab, teep, body-lock… |

**lesson_chapters** — liens horodatés
| lesson_id → lessons | start_seconds int | label text | position int |

**drills**
| colonne | type | note |
|---|---|---|
| id, slug | | comme lessons |
| title, description_md | text | |
| format | text check | `duration` ou `rounds` |
| duration_min | int null | si format = duration |
| rounds, round_seconds, rest_seconds | int null | si format = rounds |
| equipment | text[] | sac, pattes d'ours, cage, aucun… |
| partner_required | boolean | |
| stance | text check | orthodoxe / southpaw / les-deux |
| category | text check | même liste que lessons |
| source | text check | `content` (fichier Markdown) ou `user` (créé dans l'appli) |
| created_by | uuid null | auteur si `source = user` |

Drills créés dans l'appli : visibles par tous les utilisateurs connectés,
modifiables uniquement par leur auteur (RLS `created_by = auth.uid()`).
Le script d'import ne touche qu'aux drills `source = content`.

**drill_lessons** — lien plusieurs-à-plusieurs `(drill_id, lesson_id)`.
Un drill peut illustrer deux leçons (ex. jab de Strickland + jab de Joshua Van).

### Données personnelles (RLS : `user_id = auth.uid()`)

**profiles** — 1 ligne par utilisateur (`id` = id Supabase Auth) :
`display_name`, `natural_stance` (orthodoxe / southpaw), `switch_hitter` (bool), `weight_class`.

**recurring_sessions** — l'emploi du temps type de la semaine (créneaux fixes ;
physique et autre n'en ont normalement pas)
`id, user_id, weekday (1-7), start_time, duration_min, session_type, label, location, active`

**training_sessions** — séances réalisées
| colonne | type | note |
|---|---|---|
| id, user_id | | |
| date | date | aujourd'hui par défaut |
| session_type | text check | mma / grappling / boxe / sparring / physique / autre |
| duration_min | int | |
| rpe | int check 1-10 | effort perçu |
| focus | text | « focus de séance » |
| notes | text | |
| went_well | text null | bilan rapide « ce qui a marché » (facultatif, replié par défaut) |
| to_adjust | text null | bilan rapide « à ajuster » (facultatif) |
| recurring_session_id | uuid null | relie à la séance prévue → calendrier « prévu / fait » |

**session_drills** — drills faits pendant une séance
`id, session_id, user_id, drill_id, stance_used (orthodoxe / southpaw / les-deux), rounds_done, duration_min, notes, position`
(`user_id` dupliqué volontairement : la règle RLS reste simple et rapide ;
`stance_used` sert à voir si tu travailles assez des deux côtés).

**weekly_reviews** — bilan de la semaine
`id, user_id, week_start (lundi), went_well, to_adjust, next_focus, lesson_ids uuid[]`
(unique `user_id + week_start`). Le `next_focus` pré-remplit le « focus de séance »
de la semaine suivante.

### Déjà prévu pour plus tard (non créé maintenant)

| Futur | Se branche sur |
|---|---|
| Sparring par round | `sparring_rounds(session_id → training_sessions, round_number, partner, notes…)` |
| Combos | `combos(user_id null = partagé, stance, lead_leg, sequence jsonb)` + `combo_drills` |
| Timer de rounds | réutilise `drills.rounds / round_seconds / rest_seconds` |
| Poids | `weigh_ins(user_id, date, weight_kg)` |
| Compte à rebours | `fights(user_id, date, event, weight_class)` |
| Hors-ligne | uuid générés côté client + `updated_at` pour synchroniser |

## 4. Arborescence

```
mma-carnet/
├─ CLAUDE.md
├─ README.md
├─ .env.example            # noms des variables, sans valeurs
├─ .gitignore              # contient .env*
├─ content/
│  ├─ sources/             # résumés bruts (ne pas modifier)
│  ├─ lessons/             # 1 fichier .md par leçon
│  └─ drills/              # 1 fichier .md par drill
├─ scripts/
│  └─ import-content.ts    # lit content/, valide, upsert en base
├─ supabase/
│  └─ migrations/          # 1 fichier SQL par changement de schéma
├─ public/                 # icônes PWA
└─ src/
   ├─ main.tsx
   ├─ App.tsx              # routes
   ├─ lib/                 # supabase.ts, youtube.ts, dates.ts
   ├─ types/database.ts    # généré par Supabase CLI
   ├─ components/          # boutons, cartes, filtres réutilisables
   └─ features/
      ├─ auth/
      ├─ lessons/
      ├─ drills/
      ├─ journal/
      └─ calendar/
```

### Format d'une leçon (`content/lessons/attaquer-garde-opposee.md`)

```markdown
---
slug: attaquer-garde-opposee
title: Comment attaquer la garde opposée
original_title: How To Attack The Opposite Stance in MMA
youtube_id: K30fUFvwrHc
channel: Connells Combat
category: striking
distances: [moyenne, longue]
stance: toutes
matchup: garde-ouverte
tags: [teep, shovel-hook, stomp, hand-fighting]
chapters: []          # ex. - { t: "1:19", label: "Footwork" }
key_points:
  - Utiliser le hand fight comme leurre pour placer un teep au foie.
  - Intercepter le blitz adverse au shovel hook.
  - Verrouiller la distance avec le stomp sur le genou avant.
---
Sujet : …

## Déroulement
…
```

### Format d'un drill (`content/drills/teep-sur-hand-fight.md`)

```markdown
---
slug: teep-sur-hand-fight
title: Teep au foie sur engagement du hand fight
format: rounds
rounds: 3
round_seconds: 120
rest_seconds: 30
equipment: [aucun]
partner_required: true
stance: les-deux
category: striking
lessons: [attaquer-garde-opposee]
---
Partenaire en garde opposée engage la main avant ; dès le contact, teep au corps…
```

## 5. Étapes du MVP

Chaque étape = un commit qui marche, avec un test concret.

| # | Tâche | Comment on vérifie |
|---|---|---|
| 0 | `git init`, projet Vite + TS + Tailwind, `.gitignore`, `.env.example`, déploiement Vercel | La page « Bonjour » s'ouvre sur ton téléphone via l'URL Vercel |
| 1 | Projet Supabase, connexion e-mail + mot de passe, table `profiles` | Tu te connectes depuis le téléphone, tu te déconnectes |
| 2 | Manifest + icônes PWA | « Ajouter à l'écran d'accueil » fonctionne |
| 3 | Tables `training_sessions` + RLS | Test SQL : le compte B ne voit pas les séances du compte A |
| 4 | Formulaire de séance rapide | Saisie chronométrée < 30 s debout, téléphone à une main |
| 5 | Liste du journal + modification / suppression | Les séances apparaissent, de la plus récente à la plus ancienne |
| 6 | Tables `lessons`, `lesson_chapters` + RLS lecture seule | Requête OK connecté, refusée déconnecté |
| 7 | Conversion des 13 résumés en `content/lessons/*.md` | Tu relis et valides les fichiers |
| 8 | Script `npm run import` (validation + upsert par slug) | 13 leçons en base ; relancé 2 fois → toujours 13 |
| 9 | Bibliothèque : liste + filtres catégorie / distance / garde | Les filtres combinés donnent le bon résultat |
| 10 | Page leçon : iframe YouTube + chapitres cliquables + points clés | Cliquer un chapitre saute au bon moment |
| 11 | Tables `drills`, `drill_lessons`, contenu drills, import | Drills en base, liés aux leçons |
| 12 | Pages drills (liste, filtres, détail, lien vers la leçon et inversement) | Navigation leçon ↔ drill |
| 13 | Formulaire « nouveau drill » dans l'appli (+ modification par l'auteur) | Un ami voit ton drill mais ne peut pas le modifier |
| 14 | `session_drills` : cocher les drills faits (+ garde utilisée) dans le formulaire de séance | Toujours < 30 s |
| 15 | `recurring_sessions` + écran de réglage de l'emploi du temps | Tes créneaux fixes enregistrés |
| 16 | Vue semaine : prévu vs fait (+ séances hors créneau), appuyer sur un créneau prévu pré-remplit la séance | Une séance prévue passe à « faite » en 2 appuis |
| 17 | Bilan hebdomadaire (`weekly_reviews`) qui fixe le prochain focus | Le focus apparaît pré-rempli dans la séance suivante |

Prérequis à installer sur le PC avant l'étape 0 : **Node.js LTS** et **Git**.

Les champs `went_well` / `to_adjust` de chaque séance arrivent avec l'étape 4.

**Ordre proposé** : le journal (étapes 3-5) passe avant la bibliothèque parce que
tu t'entraînes déjà 5 fois par semaine : chaque séance enregistrée dès
maintenant est une donnée de plus pour préparer le combat.
