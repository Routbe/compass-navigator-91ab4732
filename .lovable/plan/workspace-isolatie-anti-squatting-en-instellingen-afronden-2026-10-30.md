# Workspace-isolatie, anti-squatting en instellingen: afronden

## Wat er al werkt
- Gratis workspaces krijgen een 4-teken suffix bij aanmaken, maar alleen via de app-code.
- Schone slug claimen (`/w/acme`) voor Plus/Pro/Business met merkcontrole.
- Profielmenu met badge (omgeving + plan), submenu "Wissel van omgeving", persoonlijke en workspace-links, Account & Beveiliging onderaan.
- `/studio/account` is alleen globaal; `/studio/w/[slug]/settings` heeft opslag, schone slug en team.

## Wat ontbreekt en wat ik bouw

### 1. Anti-squatting in de database
- Nieuwe migratie `db/0122_workspace_slug_suffix.sql`: een trigger die bij het aanmaken van een gratis workspace zonder geldige suffix (`-xxxx`) er zelf een toevoegt. Zo kan de regel niet worden omzeild.
- Een schone slug of root slug mag de database alleen bewaren als het plan Plus/Pro/Business is of de eigenaar de Early Verified-bonus heeft.
- Daarna de schema-snapshot en de databasetypes vernieuwen, plus de replay-test.

### 2. Early Verified telt mee
- `planAllowsCleanSlug` krijgt de Early Verified-bonus via de entitlement-engine, zodat deze gebruikers ook de suffix mogen weghalen.

### 3. Root slug (`rout.be/acme`)
- Nieuwe actie "Root-adres claimen" op de workspace-instellingen. Die gebruikt dezelfde controles: plan, merkbescherming, uniek over handles en aliassen. Het adres wordt bewaard als workspace-alias in de bestaande namespace-matrix.
- Op de publieke pagina `rout.be/acme` wordt een root-adres van een workspace doorgestuurd naar de workspace-pagina.

### 4. Workspace-instellingen volledig
`/studio/w/[slug]/settings` krijgt vijf secties:
- Naam aanpassen
- Adres (schone slug / root slug)
- Teamleden (bestaat al)
- Eigen domeinen: koppelen en de DNS-controle bekijken (gebruikt de bestaande domeinverificatie)
- Workspace verwijderen: alleen de eigenaar, met bevestiging door de naam te typen

Alle rechten worden op de server gecontroleerd.

### 5. Menu nalopen
- Workspace-context: de links heten "Workspace Studio", "Workspace Dashboard" en "Workspace Instellingen".
- "Account & Beveiliging" staat apart, met een schild-icoon, direct boven Afmelden.
- Een test controleert dat er nooit profielinstellingen (Vormgeving/Inhoud) in de account- of workspace-instellingen staan.

## Controle
- Nieuwe tests: trigger-regel (PGlite), Early Verified mag een schone slug, root-slug-regels, verwijderen alleen door de eigenaar, menulinks per context.
- `bunx tsgo --noEmit` 0 fouten, `bunx vitest run` volledig groen.
- `roadmap.md` en `AGENTS.md` bijwerken.

## Technische details
- Trigger in plpgsql op `workspaces` BEFORE INSERT/UPDATE OF slug, plan. Het plan komt uit de kolom, de Early Verified-bonus uit `profiles.verified` via `entitlement_overrides`. De suffix is `substr(md5(gen_random_uuid()::text),1,4)`.
- Nieuwe server functions in `workspaces.functions.ts`: `renameWorkspace`, `claimRootWorkspaceSlug`, `deleteWorkspace`. Pure regels in `workspace-rules.ts`.
- Er is geen live database: de migratie wordt alleen in PGlite getest. Op Neon draaien wacht op de databasesleutel.
