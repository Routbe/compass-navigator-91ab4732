# ROUT Fase 2 t/m 5 — wat nog open staat

Veel van de directive zat al in de geïmporteerde code: identity_links en de append-only events (0113/0114), automerge uit, de proof-validators, pairwise sub, refresh-families, revoke/introspect, end-session, reserved brands (0116), de namespace matrix voor gratis workspaces en account_deletions (0118). Dit plan bouwt alleen wat nog ontbreekt en controleert daarna alles.

## Stap 0 — Nulmeting
- `tsgo --noEmit` en de volledige `bunx vitest run` draaien op de geïmporteerde code en de fouten oplossen voordat er iets nieuws bijkomt.
- Kort nagaan dat wat in de roadmap als klaar staat echt in de code zit (automerge-blokkade met de Nederlandse foutmelding, step-up ≤ 5 min, state-HMAC, notificatiemail met intreklink, `iss` in de authorize-response, `prompt`/`max_age`/`auth_time`/`acr`). Ontbrekende stukken komen in de stap van hun fase.

## Fase 2 — afronden
- De koppel-flow in de UI (Identiteit): koppelen, opnieuw verifiëren, inloggen aan/uit (`login_enabled` staat standaard uit), intrekken. Elke stap schrijft een event in de hash-keten.
- Eén-klik intrekken vanuit de mail: GET toont alleen een bevestiging, POST trekt echt in (dat volgt de regel voor gemailde actielinks).
- Mastodon rel="me" als proof_method.

## Fase 3b
- Console: `post_logout_redirect_uris` per client beheren. Validatie loopt via `redirect-match.ts` en end-session gebruikt die lijst.
- `/studio/account` → Verbonden apps: lijst uit `oauth_consents`. Intrekken per app trekt ook de refresh-family en de access tokens van die app in.

## Fase 4b
- Merknamen: admin-scherm om een gereserveerde naam na verificatie vrij te geven (assertAdminRole, audit-event).
- Upgrade naar Plus/Pro biedt een schone slug aan, met dezelfde controle via isValidWorkspaceSlug en isReservedName.
- DNS-claim: nieuwe migratie `0119_domain_claims.sql`. TXT `_rout.<domein>` = `rout-verify=base64url(HMAC(KEK, user_id||domein))`. De handle komt uit de PSL (tldts, dus `*.github.io` wordt geweigerd). Daarna een identity_link `provider='domain'` en de badge `dns_verified`. De bestaande cron `check-dns` wordt uitgebreid met hercontrole en 30 dagen respijt.
- Passkey-first: WebAuthn Conditional UI (autofill) op het inlogscherm. Het PasskeysPanel komt in `/studio/account` (toevoegen, hernoemen, verwijderen).
- Data Vault: `GET /api/user/vault/export` maakt een ZIP met JSON (jszip): profiel, links, media, boekingen, intake (alleen voor de eigenaar), identity_links, sessies en consents.
- Hard delete: knop in `/studio/account` met verse step-up. Daarna staat het account 7 dagen op `pending_deletion` (annuleren kan) en draait dagelijks de cron `/api/public/cron/purge-accounts` die de cascade uitvoert en een ondertekend audit-event achterlaat.
- Scope: de bovenbalk toont de actieve scope plus het plan. Het tabblad Team verhuist van `/studio/account` naar `/studio/w/$slug/settings`. Bestanden en media toont in een workspace het workspace-quotum, links/statistieken/instellingen per scope.

## Fase 5
- `0120_rls_policies.sql`: policies voor de 77 tabellen met RLS aan maar zonder policies, gebaseerd op `rout_app` + `current_setting('rout.user_id', true)`. `neon.ts` zet `rout.user_id` per transactie. Let op: `rout_app` omzeilt RLS vandaag. De policies werken pas als die rol `NOBYPASSRLS` krijgt, en dat is een infrastap buiten de code.
- `0121_users_consolidation.sql`: FK `public.users(id)` → `neon_auth."user"(id)` ON DELETE CASCADE, plus een weescontrole vooraf. `password_hash` wordt eerst niet meer gelezen of geschreven en daarna in een aparte delta-migratie verwijderd.
- Na elke migratie: `bun scripts/schema-replay-snapshot.ts` (offline) om de snapshot en db-types bij te werken.

## Tests (één per regel)
Pairwise sub (deterministisch per sector, verschilt tussen sectors), hergebruik van een refresh token trekt de hele family in, revoke/introspect, automerge geblokkeerd, step-up ouder dan 5 min geweigerd, uniciteit van (issuer, sub), PSL-weigering, HMAC van het TXT-record, respijt van 30 dagen, bedenktermijn van 7 dagen, de gratis 4-teken suffix en isReservedName op alle drie de plekken, plus de bestaande replay/catalog/no-runtime-DDL-tests.

## Afsluiten
roadmap.md en AGENTS.md bijwerken, tsgo 0 fouten, vitest groen.

## Grenzen in deze omgeving
- In deze kopie zijn geen geheime sleutels ingesteld (DATABASE_URL, KEK, pairwise-secret, Brevo). Migraties kunnen dus alleen offline via de PGlite-replay getest worden. Live uitvoeren en ingelogde end-to-end controles moeten wachten tot de sleutels via het beveiligde formulier zijn toegevoegd.
- Buiten de code blijven staan: de KEK op Vercel, seal-signing-keys, CREATE op public intrekken en NOBYPASSRLS voor rout_app.
- Dit is veel werk en wordt in meerdere rondes gebouwd, in de volgorde van dit plan.
