# CS2 Match Stats Extraction Prompt

Tento soubor obsahuje prompt, který vložíš AI spolu se screenshotem scoreboardu z CS2 zápasu.
AI extrahuje data a dá ti je ve formátu, který přímo vložíš do aplikace.

---

## Jak používat

1. Udělej screenshot scoreboardu na konci zápasu (Tab screen v CS2)
2. Vlož screenshot do AI (Claude/ChatGPT) spolu s promptem níže
3. AI ti vrátí JSON data
4. V JSON data přepiš `profile_id` k správným in-game jménům (AI ti dá in-game name + prázdné profile_id)
5. Data vlož přes edit match formulář v aplikaci, nebo přímo do Supabase

---

## Hráči v aplikaci (pro mapování ID)

Aktuální seznam hráčů v CS2 Pickeru. Použij tyto IDs při mapování in-game jmen:

```
Sebadam    → fd097b4c-e5a3-4ef5-8471-29a8307c8418
33ban111   → 46bfb382-998c-4dd9-baf7-0230b15a36ad
Daník      → 90c440e9-62ca-40e0-b5d6-4fe606984764
DaveyG     → 2e4add64-5757-4259-b482-aa033769662b
Griller    → 47e63dc8-99d9-43fc-8452-4610b9e4e1ad
Jirka      → 16c4f715-a6c8-4e25-80f5-b25b87482208
Kapřík     → 87e2cc72-dff8-47a5-9e71-b02d5e677439
Karlíto    → dc0b8eaf-8949-4aae-ba59-fdc575ada84c
Kratěj     → b390f259-6534-4bf4-8183-375cf87ac08d
Máca       → 8fa7a38e-714d-4e79-afe9-de556c62177b
Mák        → c1410ea0-61bc-486f-aefe-e1bca0dd9c9d
Minimák    → eaf5e42d-2af4-4724-b584-dd2ed94ec881
Pepa       → a99fa0bd-e396-48c4-a024-4e88a1111216
Sládek     → 2a65c690-4bb5-4d27-8844-21d80cdbe1cd
Sudo       → ba6b7920-7653-424c-be04-6553954ae1d8
Suťák      → 6120845b-8659-4215-ba0d-e0377ab084bf
Víťa       → c9f397bb-a969-481e-a010-f3681a5393df
```

---

## Prompt pro AI

Zkopíruj celý blok níže a vlož do AI spolu se screenshotem:

````
Podívej se na tento CS2 scoreboard screenshot.

Extrahuj z něj tato data pro KAŽDÉHO hráče:
- In-game jméno (přesně jak je na screenshotu)
- Kills (K)
- Deaths (D)
- Assists (A)
- Damage (celkový damage - pokud je na screenshotu ADR, vynásob ho počtem odehraných kol)

Také extrahuj:
- Skóre zápasu (kolik kol vyhrál každý tým, např. 13:8)
- Kdo vyhrál (CT nebo T strana, nebo remíza)

Tady jsou hráči registrovaní v mé aplikaci s jejich IDs. Přiřaď každé in-game jméno k správnému profile_id. Pokud si nejsi jistý, nech profile_id prázdné a napiš mi poznámku:

```
Sebadam    → fd097b4c-e5a3-4ef5-8471-29a8307c8418
33ban111   → 46bfb382-998c-4dd9-baf7-0230b15a36ad
Daník      → 90c440e9-62ca-40e0-b5d6-4fe606984764
DaveyG     → 2e4add64-5757-4259-b482-aa033769662b
Griller    → 47e63dc8-99d9-43fc-8452-4610b9e4e1ad
Jirka      → 16c4f715-a6c8-4e25-80f5-b25b87482208
Kapřík     → 87e2cc72-dff8-47a5-9e71-b02d5e677439
Karlíto    → dc0b8eaf-8949-4aae-ba59-fdc575ada84c
Kratěj     → b390f259-6534-4bf4-8183-375cf87ac08d
Máca       → 8fa7a38e-714d-4e79-afe9-de556c62177b
Mák        → c1410ea0-61bc-486f-aefe-e1bca0dd9c9d
Minimák    → eaf5e42d-2af4-4724-b584-dd2ed94ec881
Pepa       → a99fa0bd-e396-48c4-a024-4e88a1111216
Sládek     → 2a65c690-4bb5-4d27-8844-21d80cdbe1cd
Sudo       → ba6b7920-7653-424c-be04-6553954ae1d8
Suťák      → 6120845b-8659-4215-ba0d-e0377ab084bf
Víťa       → c9f397bb-a969-481e-a010-f3681a5393df
```

Vrať mi výsledek PŘESNĚ v tomto JSON formátu:

```json
{
  "match": {
    "score_ct": 13,
    "score_t": 8,
    "winning_team": "CT",
    "total_rounds": 21
  },
  "players": [
    {
      "ingame_name": "ExamplePlayer",
      "profile_id": "fd097b4c-e5a3-4ef5-8471-29a8307c8418",
      "kills": 25,
      "deaths": 18,
      "assists": 4,
      "damage": 2100
    }
  ]
}
```

Důležité:
- winning_team může být "CT", "T", nebo "draw"
- Pokud na screenshotu je ADR (average damage per round) místo celkového damage, vynásob ADR * total_rounds a zaokrouhli na celé číslo
- Pokud damage na screenshotu není vidět, dej 0
- Vrať data pro VŠECH 10 hráčů
- U profile_id se snaž matchnout in-game name s registrovanými jmény (můžou se lišit - např. hráč "seba" může být "Sebadam")
````

---

## SQL pro hromadné vložení stats (alternativa k UI)

Pokud chceš vložit data přímo do databáze, použij tento SQL template:

```sql
-- Nejdřív updatni match score (nahraď MATCH_ID):
UPDATE cs2picker_matches
SET score_ct = 13, score_t = 8, winning_team = 'CT'
WHERE id = 'MATCH_ID';

-- Pak vlož player stats:
INSERT INTO cs2picker_match_player_stats (match_id, profile_id, kills, deaths, assists, damage)
VALUES
  ('MATCH_ID', 'PROFILE_ID_1', 25, 18, 4, 2100),
  ('MATCH_ID', 'PROFILE_ID_2', 20, 15, 6, 1800)
ON CONFLICT (match_id, profile_id)
DO UPDATE SET kills = EXCLUDED.kills, deaths = EXCLUDED.deaths, assists = EXCLUDED.assists, damage = EXCLUDED.damage;
```
