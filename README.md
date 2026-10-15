# Carnet MMA

Application web (PWA) pour structurer l'entraînement : leçons → drills → séances → bilan.

- Contexte et règles de travail : [CLAUDE.md](CLAUDE.md)
- Plan, modèle de données, étapes : [docs/PLAN.md](docs/PLAN.md)

## Démarrer en local

Prérequis : Node.js LTS et Git.

```
npm install
npm run dev
```

Pour tester sur le téléphone (même Wi-Fi) : `npm run dev -- --host`, puis ouvrir
l'adresse « Network » affichée dans Safari.
