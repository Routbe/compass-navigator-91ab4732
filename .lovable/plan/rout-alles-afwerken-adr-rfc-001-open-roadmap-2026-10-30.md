# ROUT — Alles afwerken (ADR RFC-001 + open roadmap)

## Wat al klaar is (gecontroleerd in de code)
- **Fase 0:**
  - migraties sorteren numeriek (`migration-plan.ts`)
  - signing keys zijn verzegeld met de KEK uit `ROUT_PROVIDER_SIGNING_KEK`
  - een onbekende `kid` wordt geweigerd
- **Fase 1:**
  - geen `drizzle/` of `supabase/` meer
  - `runSchemaEnsure` komt alleen nog voor in de no-runtime-DDL-test
  - snapshot en `db-types.gen.ts` bestaan
- **RLS:** `db/109` (RLS aan) en `db/0120` (policies) staan er.
- **Namespace Matrix:** de suffix voor gratis workspaces, de merkenlijst (`db/0116`) en de schone slug bij Plus/Pro werken.
- **Bestaande functies:**
  - DNS-claims met een zwarte domeinbadge
  - passkeys (paneel en login)
  - kluis-export op `/api/user/vault/export`
  - account verwijderen met 7 dagen bedenktijd

## Wat nog openstaat en ik nu bouw

### 1. Profielmenu wordt context-bewust
- Bovenaan staat een badge met de actieve context ("Persoonlijk" of "Workspace: Acme") en het plan (FREE/PLUS/PRO).
- **In Persoonlijk:** links naar Persoonlijke Studio en Dashboard.
- **In een workspace:** links naar Workspace Studio, Workspace Dashboard en Workspace-instellingen (`/studio/w/$slug/settings`).
- "Account & Beveiliging" staat altijd onderaan, afgescheiden, net boven "Uitloggen".
- Alle teksten in het Nederlands (nu staan er nog "Sign Out" en "Account & Security").

### 2. Instellingen fysiek scheiden
- Nieuwe route `/studio/account`, die dezelfde globale accountpagina toont. `/settings` blijft werken als doorverwijzing.
- Profiel-Hub-zaken (Vormgeving en ontwerpsjablonen) gaan uit de accountpagina. Ze staan al in de Studio-tabbalk.
- Een test bewaakt dat `/studio/account` geen team-, workspace- of vormgevingspanelen bevat.

### 3. Open roadmappunten die met code af te werken zijn
- **Links, statistieken en instellingen per scope:** in een workspace tonen Studio en Dashboard de workspace-gegevens, niet je persoonlijke profiel. Serverfuncties filteren op de actieve scope.
- **Mastodon `rel="me"`-verificatie bij Identiteit:**
  - de server haalt het Mastodon-profiel op via de beveiligde proxy
  - de server zoekt daarin een `rel="me"`-link naar het rout.be-profiel
  - bij een treffer markeert de server de koppeling als geverifieerd
- **Rondleiding:** de rondleiding wordt een compact (?)-icoon.
- **Live integratie:** de glitch in de bovenbalk van het venster "Live integratie toevoegen" wordt verholpen.
- **Snapchat-koppeling:** eerst onderzoeken wat er misgaat, dan herstellen. Is er een sleutel van Snapchat nodig, dan meld ik dat.

### 4. Blauwdruk Dashboard-performance (alleen een voorstel, nog geen code)
Zoals gevraagd lever ik eerst een voorstel ter goedkeuring, als document in Bestanden:
- **Knelpunten:** Dashboard doet nu losse verzoeken (3x `Promise.all` met meerdere queries).
- **Eén CTE-query** per scope voor het overzicht (opgeslagen QR's, scans, recente scans).
- **Caching** met `defineCachedFunction` / SWR (bijv. `maxAge` 60 s, `swr: true`), alleen voor niet-kritieke statistieken:
  - de cache-sleutel bevat altijd de scope (gebruiker of workspace), zodat er nooit data tussen scopes lekt
  - een `private`-header
  - de cache wordt geleegd bij schrijfacties

## Verificatie
- `bunx tsgo --noEmit` = 0 fouten, en de volledige `bunx vitest run` groen.
- Nieuwe tests:
  - de menulinks per context
  - de scheiding op `/studio/account`
  - de `rel="me"`-parser
  - de scopefilter van de statistieken
- `roadmap.md` en `AGENTS.md` bijwerken.

## Blijft wachten op iets buiten de code
- **`db/106`, `107`, `0120` en `0121` op Neon draaien:** daarvoor is de live databasesleutel nodig.
- **KEK op Vercel en legacy keys verzegelen:** komt na de deploy. Daarna kan ook het CREATE-recht van `rout_app` op `public` worden ingetrokken.
- **Video-upload naar Scaleway:** daarvoor zijn de opslagsleutels nodig.
- **Ingelogde end-to-end controles:** daarvoor is een live database nodig.
