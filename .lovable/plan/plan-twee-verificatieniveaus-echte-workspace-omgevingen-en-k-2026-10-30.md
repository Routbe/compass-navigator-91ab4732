# Plan: Twee verificatieniveaus, echte workspace-omgevingen en klikbare vertrouwensbadges

Drie opdrachten, in deze volgorde gebouwd. Eén deel staat er al: een tabel met verificaties per account (db/0130), een publieke workspacepagina `/w/$slug`, een workspace-keuzemenu en kolommen die gegevens aan een workspace koppelen. Die bouw ik verder uit en vervang ik niet.

## 1. Twee verificatieniveaus (echt mens vs. wettelijke naam)

**Wat je ziet**
- In het account in de Studio komen twee aparte blokken:
  1. **Wettelijke naam (blauw vinkje)**: paspoortscan via Didit. Na verificatie zie je "[✓] Geverifieerde Wettelijke Identiteit".
  2. **Echt mens (pseudoniem)**: via W Identity of een passkey, zonder dat je naam gedeeld wordt. Na verificatie zie je "[🛡️] Geverifieerd Uniek Mens".
- Op je hoofdprofiel (`rout.be/handle`) verschijnt het blauwe vinkje alleen bij een geverifieerde wettelijke naam.
- Op een privé-alias (`rout.be/u/alias`) verschijnt je echte naam nooit. Je kunt daar zelf een discrete badge "🤖 No Bot / Real Human" aanzetten, als je een van beide niveaus hebt.

**Regels die altijd gelden**
- Een paspoort kan maar op één account het blauwe vinkje geven.
- Een W Identity-account kan maar aan één ROUT-account gekoppeld worden.
- Een passkey bewijst niet op zichzelf dat iemand uniek is. Daarom geeft een passkey alleen niveau 1 als bewijs naast een andere unieke verificatie. Bij de bouw toon ik dit eerlijk als "aanvullend bewijs".

**Wie €3,99 betaalde**: hun vinkje blijft zoals eerder afgesproken. Ik verander dat niet zonder jouw akkoord.

## 2. Workspaces als volledig aparte omgeving

**Wat je ziet**
- **Wisselaar bovenaan**: `[👤 Persoonlijk]` ↔ `[🏢 Workspace]` ↔ `[➕ Nieuwe workspace]`. Na een wissel toont alles alleen de gegevens van die omgeving:
  - Profiel Hub: in een workspace bewerk je de pagina van het bedrijf (`rout.be/w/naam-x89a`), niet je eigen profiel.
  - QR-generator: codes worden opgeslagen en getoond per workspace.
  - Developer Console: API-sleutels, apps en webhooks per workspace.
  - Statistieken: alleen van die workspace.
- **Nieuwe workspace, 5 stappen**, zoals Vercel, GitHub en Slack het doen. Elke stap toont de voortgang, je kunt terug, en wat je invult blijft bewaard:
  1. Naam, logo en korte omschrijving.
  2. Adres met live voorbeeld `rout.be/w/acme-corp-x89a` en een controle of het nog vrij is. De 4 willekeurige tekens zijn verplicht bij gratis workspaces, zoals al vastgelegd.
  3. Categorie: Bedrijf / KMO, Agency / Studio, Non-profit, Event of Project.
  4. Leden uitnodigen per e-mail, met rol Admin, Developer of Viewer. Deze stap kun je overslaan.
  5. Plan en opslag: Free naast Pro/Max met opslag, QR- en API-limieten, hoeveel opslag je nu hebt, en de knop "Workspace voltooien & openen".
- **Publieke workspacepagina** `/w/naam-x89a` toont de eigen Profiel Hub van het bedrijf. Is er een eigen domein gekoppeld, dan stuurt de pagina daarheen door.

## 3. Klikbare vertrouwensbadges op profielen

- **Groen vinkje bij sociale accounts**: als je erop klikt, opent "Geverifieerd Account-Eigendom" met platform, @naam, de methode (bio-link), de datum van de laatste controle, het bewaarde aantal volgers en de belofte "Nul live tracking API-calls bij jouw bezoek".
- **Blauw vinkje**: als je erop klikt, zie je uitleg over de wettelijke naamverificatie, zonder persoonsgegevens.
- **"Lid sinds"**: dit wordt een badge die het systeem zelf maakt uit de aanmaakdatum van het account. Als je erop klikt, opent "ROUT Account Genesis" met de exacte datum, een unieke genesis-stempel en "Officieel geregistreerd ROUT-lid". Wie "Lid sinds …" zelf in een bio typt, wordt bij het opslaan geweigerd met uitleg.
- **Early Believer-embleem**: een eigen vectortekening van een open hand die een kiemplantje draagt, in de stijl van je voorbeeld, maar in de ROUT-kleuren obsidiaan, goud en blauw. Het staat naast de naam en als stempel in het Digitaal Paspoort. Als je erop klikt, opent "Early Believer & Pioneer Member" met jouw tekst, de datum van toekenning en een uniek badge-nummer.
- Alle vensters openen en sluiten vlot op mobiel: als onderblad op telefoon en als popover op desktop.

## Technische details

- **Migratie `db/0131_tiers_and_workspace_tenancy.sql`** (nieuw bestand, eerdere migraties blijven ongewijzigd):
  - `verified_identities`: `tier_1_real_human` en `tier_2_legal_identity` als booleans, die de bestaande `tier`-kolom vervangen. Verder `national_id_nullifier` UNIQUE, `provider_sub_nullifier` met UNIQUE (provider, provider_sub_nullifier), en het bestaande UNIQUE op user_id wordt een rij per (user_id, provider).
  - `workspace_id` toevoegen waar het ontbreekt: `links`, `api_keys`, `webhooks`, `vault_files`. `profiles`, `tracked_qrs` en `oauth_clients` hebben het al.
  - De `rout_scope`-policies bijwerken zodat een rij met `workspace_id` alleen zichtbaar is voor leden (`rout_is_workspace_member`). `workspaces.short_code` alleen toevoegen als het suffix nog niet gedekt is door db/0122.
  - `workspaces.category` en `description` toevoegen.
  - Daarna het schema-overzicht vernieuwen via `schema-replay-snapshot.ts`.
- **Pure regelbestanden met tests**:
  - `identity-tiers.ts`: welke badge waar mag verschijnen.
  - Isolatieregels in de bestaande scope-module: elke query voor profielen, QR-codes, de console en statistieken krijgt het filter op de actieve scope. Persoonlijk betekent `workspace_id is null`.
  - `genesis-stamp.ts`: HMAC van user-id plus created_at, deterministisch en niet te vervalsen.
  - Een bio-check op "Lid sinds".
- **Lagen**: de server bepaalt de scope via de bestaande HttpOnly cookie en `activateScopeFromUrl`. Een wissel leegt de cache. De wizard staat op de route `/studio/workspaces/new` en maakt de workspace pas aan in de laatste stap, in één transactie. Uitnodigingen lopen via het bestaande invite-systeem.
- **UI**: `TrustBadgeModal` (Dialog op desktop, Drawer op mobiel), `PioneerEmblem.tsx` (eigen SVG met semantische tokens) en de herschikte verificatiekaart in het account.
- **Verificatie**: tsgo, de volledige Vitest-suite, nieuwe isolatietests (persoonlijk ≠ workspace, niet-lid ziet niets) en Playwright-screenshots op een mobiel scherm van de vensters en de wizard.
- **Roadmap.md** volgt elke deelstap. Wat blijft liggen: sms voor het beveiligingscentrum, en het afnemen van betaalde vinkjes (wacht op jouw akkoord).
