# ROUT — Fase 2, 4 en 5 afronden

## Wat ik vooraf vond
- `admin.brands.tsx` bestaat nog niet; `identity.revoke.tsx` en `api_.public.cron.purge-accounts.ts` bestaan al.
- `password_hash` in `public.users` wordt nog actief gebruikt: wachtwoord-login in `auth/users.server.ts`, account-samenvoeging, admin-reset, identiteitencheck en workspace-conversie. Als ik de kolom direct verwijder, werken die paden niet meer.
- De server-rollen (`neondb_owner`, `rout_app`) omzeilen RLS. Nieuwe policies beschermen dus alleen tegen andere rollen, totdat `rout_app` die omzeiling kwijtraakt.

## Stap 0 — Basislijn herstellen
1. Draai `bun scripts/schema-replay-snapshot.ts` (neemt 0119 op).
2. Laat de routeboom opnieuw genereren en draai `bunx tsgo --noEmit` en de migratie-replay-test.
3. Los eventuele fouten op tot alles groen is.

## Stap 1 — Fase 4: schone slug bij een upgrade
- Nieuwe pure regel `cleanSlugEligibility(plan, slug)` in `workspace-rules.ts`. Gratis workspaces houden hun suffix; bij Plus of Pro mag de slug schoon.
- Nieuwe serverfunctie `claimCleanWorkspaceSlug(workspaceId, slug?)` in `workspaces.functions.ts`, met deze controles:
  - eigenaar of beheerder (server-side)
  - plan via `entitlement-engine.server.ts`
  - `isValidWorkspaceSlug`
  - uniekheid (hoofdletterongevoelig)
  - `isReservedName`, alleen toegestaan met `hasBrandRelease`
- Het opslaan gebeurt atomair, met een unieke-sleutelfout vertaald naar een Nederlandse melding.
- UI-kaart "Schone workspace-naam" in de workspace-instellingen.
- Admin-pagina `admin.brands.tsx` om merkvrijgaven toe te kennen en in te trekken, met `assertAdminRole`.

## Stap 2 — Fase 4: scheiding tussen persoonlijk en workspace
- `/studio/account` toont alleen persoonlijke panelen: Passkeys, Identiteitskoppelingen, Eigen domein, Domeinclaim, Data-export en Account verwijderen.
- Team-/ledenbeheer en workspace-domeinen verhuizen naar `/studio/w/$slug/settings`, met lidmaatschapscontrole via `activateScopeFromUrl`.
- Opslagweergave: nieuwe serverfunctie `getActiveScopeStorage()`, die hetzelfde scopepad gebruikt als `checkActiveScopeUpload`. In een workspace toont Studio het workspace-quotum en `STORAGE_QUOTA_MESSAGE` bij 0 MB of overschrijding.

## Stap 3 — Fase 5: database
- `db/0120_rls_policies.sql`: idempotente policies (`drop policy if exists` + `create policy`) voor elke tabel met RLS aan maar zonder policy.
  - Eigen rijen via `user_id::text = current_setting('rout.user_id', true)`.
  - Workspace-rijen via lidmaatschap in `workspace_members`.
  - Tabellen die alleen de server gebruikt (tokens, sleutels, logs) krijgen bewust geen policy en blijven dus dicht. Dat leg ik vast in de RLS-audittest.
- `db/0121_users_consolidation.sql`:
  - Koppeling `public.users(id)` aan `neon_auth."user"(id)` met `ON DELETE CASCADE`, als `NOT VALID` constraint. Bestaande verweesde rijen blokkeren de migratie dan niet; valideren gebeurt later live. Eerst controleer ik of de id-types gelijk zijn. Zijn ze dat niet, dan gebruik ik een koppelkolom.
  - `password_hash` wordt alleen gemarkeerd als verouderd (`COMMENT`) en niet verwijderd, omdat de code hem nog gebruikt. Code die nog naar de kolom schrijft, gaat via Better Auth waar dat zonder gedragswijziging kan. De echte verwijdering wordt een latere migratie, nadat dit op rout.be draait (migraties zijn onveranderlijk).
- Na elke migratie: snapshot en db-types opnieuw opbouwen via de PGlite-replay.

## Stap 4 — Tests en documentatie
- Nieuwe tests:
  - schone slug: gratis wordt geweigerd, Plus/Pro toegestaan, gereserveerde naam alleen met vrijgave, dubbele slug geweigerd
  - scopekeuze voor de opslagweergave
  - de accountpagina bevat geen teampanelen
  - de policies in 0120 compileren in PGlite
  - de koppeling uit 0121 bestaat
- Volledige `bunx vitest run` en `bunx tsgo --noEmit`, beide groen.
- `roadmap.md`: Fase 2 t/m 5 afvinken. Wat buiten de code wacht (live migraties draaien, KEK op Vercel) blijft open, met de reden erbij.
- `AGENTS.md`: één regel over het claimen van een schone slug, en één regel over het RLS-policypatroon.

## Wat zonder live database niet te controleren is
Het toepassen van 0120/0121 op Neon en ingelogde end-to-end controles. Die blijven open in de roadmap.
