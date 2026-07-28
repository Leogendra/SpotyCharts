# SpotyCharts v2.0

## https://spotycharts.gatienh.fr

Évaluez vos connaissances sur les artistes Spotify, avec 175+ artistes du top mondial et 100+ artistes français !

2 modes de jeu disponibles :
- Followers
- Auditeurs mensuels

Vous ne reconnaissez pas l'artiste ? Appuyez sur "Qui" pour voir sa musique la plus connue.

Un mode speedrun est disponible en cliquant sur le logo SPOTYCHARTS.

---

## Architecture

Application servie par un backend Node.js unique :

- Serveur Express qui sert le front statique (`public/`) et les données (`data/`).
- Endpoint admin protégé qui déclenche à la demande la mise à jour des données via RapidAPI (`spotify23`).
- Round-robin sur plusieurs clés RapidAPI, retries avec backoff, écriture atomique, verrou anti-runs concurrents.

## Installation

```bash
pnpm install
```

Créer un `.env` :
```bash
# Sent by admin clients as `Authorization: Bearer <token>`.
ADMIN_TOKEN=admin-password

# RapidAPI keys for spotify23.p.rapidapi.com. At least one required.
# Used in round-robin to spread quota across accounts.
RAPIDAPI_API_KEY_1=
RAPIDAPI_API_KEY_2=
RAPIDAPI_API_KEY_3=

# Max parallel outbound requests during an ingest run.
INGEST_CONCURRENCY=4

# Per-request timeout for outbound HTTP calls (ms).
INGEST_TIMEOUT_MS=15000
```

## Utilisation

Démarrer le serveur :

```bash
pnpm dev
```

Le front est disponible sur http://localhost:3434.

Déclencher une mise à jour des données :

```bash
# tout (fr + en)
curl -H "Authorization: Bearer $ADMIN_TOKEN" "http://localhost:3434/fetch-artists?lang=all"

# une seule langue
curl -H "Authorization: Bearer $ADMIN_TOKEN" "http://localhost:3434/fetch-artists?lang=fr"
```

## Ajouter / retirer un artiste

Éditer `config/artists.json` :

```json
{
  "fr": [{ "id": "5j4HeCoUlzhfWtjAfM1acR", "name": "Stromae" }],
  "en": [{ "id": "0du5cEVh5yTK9QJze8zA0C", "name": "Bruno Mars" }]
}
```

Puis relancer `/fetch-artists?lang=fr` (ou `en`, ou `all`).

## Variables d'environnement

| Nom | Description |
|---|---|
| `PORT` | Port HTTP du serveur (défaut `3434`). |
| `ADMIN_TOKEN` | Bearer token attendu sur `/fetch-artists`. Min. 8 caractères. |
| `RAPIDAPI_API_KEY_1..3` | Clés RapidAPI pour `spotify23`. Au moins une requise, utilisées en round-robin. |
| `INGEST_CONCURRENCY` | Nb de requêtes RapidAPI en parallèle (défaut `4`). |
| `INGEST_TIMEOUT_MS` | Timeout par requête sortante en ms (défaut `15000`). |
