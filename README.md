# SpotyCharts v2.0

Test your knowledge of Spotify top charts by guessing who has the most monthly listeners between two artists. Available at [https://spotycharts.gatienh.fr](https://spotycharts.gatienh.fr).

- Two datasets: 175+ artists from the world top and 100+ french artists!
- Click "Who" to see the most popular song of an artist.
- A speedrun mode is available by clicking the SPOTYCHARTS logo.

## Installation

```bash
pnpm install
```

Create a `.env`:
```bash
# Sent by admin clients as `Authorization: Bearer <token>`.
ADMIN_TOKEN=admin-password

# RapidAPI keys for spotify23.p.rapidapi.com. At least one required.
# Used in round-robin to spread quota across accounts.
RAPIDAPI_API_KEY_1=
RAPIDAPI_API_KEY_2=
RAPIDAPI_API_KEY_3=
```

## Usage

Start the server:
```bash
pnpm dev
```

Trigger a data refresh:

```bash
# everything (fr + en)
curl -H "Authorization: Bearer $ADMIN_TOKEN" "http://localhost:3434/fetch-artists?lang=all"

# a single language
curl -H "Authorization: Bearer $ADMIN_TOKEN" "http://localhost:3434/fetch-artists?lang=fr"
```

## Editing artists

Edit `config/artists.json`:

```json
{
  "fr": [{ "id": "5j4HeCoUlzhfWtjAfM1acR", "name": "Stromae" }],
  "en": [{ "id": "0du5cEVh5yTK9QJze8zA0C", "name": "Bruno Mars" }]
}
```

Then run `/fetch-artists?lang=fr` (or `en`, or `all`) again.