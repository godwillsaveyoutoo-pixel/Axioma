# AXIOMA Speel — themabibliotheek

Deze build gebruikt de echte startschermen van de games als live previews, maar toont ze niet allemaal tegelijk op de homepage.

## Informatiearchitectuur

- **Ontdek** — één uitgelicht spel, optioneel **Ga verder**, daarna wiskundethema's.
- **Thema's** — de volledige wiskundebibliotheek per domein.
- **Mijn spellen** — lokaal bewaarde voortgang en laatst gespeelde games.
- **Themapagina** — pas nadat een thema gekozen is verschijnen de games binnen dat onderwerp.

Dat maakt de portal schaalbaar: tientallen nieuwe games hoeven de startpagina niet drukker te maken.

## Nieuwe game toevoegen

Voeg de HTML-build toe aan `games/` en maak één metadata-entry in `assets/app.js` in `GAMES` met:

- `id`
- `title`
- `domain` (een ID uit `TOPICS`)
- `math` (kort specifiek wiskundethema)
- `desc`
- `file`
- `total`
- `progress()` indien de game lokale voortgang bewaart

Nieuwe domeinen kunnen bovenaan in `TOPICS` worden toegevoegd. Een domein zonder games verschijnt nog niet in de publieke navigatie.

## Smartphone

De portal zelf blijft portrait-vriendelijk. Na een expliciete tik op een spel probeert de player fullscreen en landscape te activeren. Als orientation lock niet beschikbaar is, verschijnt in portrait een draaig提示ing.

## Lokaal testen

Gebruik bij voorkeur een lokale webserver (niet enkel `file://`), bijvoorbeeld:

```bash
python3 -m http.server 8080
```

Open daarna `http://localhost:8080` vanuit deze map. Voor PWA-installatie is HTTPS vereist buiten localhost.

## Spelwerelden toegevoegd in v4

De bibliotheek bevat nu ook de aparte categorie **Games & spelwerelden** met:

- CONTINUUM · World 1
- Gravity Maze
- Cellquation
- INSLEG

Cellquation verschijnt daarnaast ook bij **Getallen & verhoudingen**. De volledige originele runtime-mappen zijn onder `games/` opgenomen zodat relatieve assets, interne navigatie, audio en saves intact blijven.

Tijdens het spelen blijft boven het iframe een duidelijke **AXIOMA · menu**-knop zichtbaar. Die sluit de spelplayer en brengt de leerling terug naar de pagina vanwaar het spel gestart werd. Cellquation mag in portrait of landscape draaien; de andere ingebouwde spellen behouden de landscape-gate.
