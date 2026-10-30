# ROUT Fase 2 t/m 5: Sovereign Identity & Enterprise

## Uitgangspunt (gecontroleerd in de geïmporteerde code)
- Al aanwezig, deels af: `db/0113_identity_links.sql`, `0114_identity_links_backfill.sql`, `0115_oauth_refresh_tokens.sql`, `src/lib/identity/proofs/*` (oidc, github, mastodon, atproto), `link-rules.ts`, `src/lib/oauth/subject.ts` (+ test), `tokens.server.ts`, introspect-route.
- Nog niet aanwezig: `reserved_brands`, `isReservedName`, revoke- en end-session-routes, Data Vault, DNS-claims.
- Bekende typefout: `src/lib/oauth/provider.server.ts:239`.
- Er is in dit project nog geen database (Neon) gekoppeld. Migraties uitvoeren, `schema-snapshot` tegen live draaien en ingelogd testen kan pas daarna. De PGlite-replaytest werkt wel zonder.

## Werkwijze
Eerst de bestaande Fase 2/3-bestanden doorlezen en vergelijken met de opdracht. Daarna aanvullen, niet opnieuw schrijven. Per fase: code, migratie, tests, snapshot via PGlite-replay, en roadmap bijwerken.

## Fase 2: Identity graph
- `better-auth.server.ts`: automatisch koppelen op e-mail uitzetten. Een onbekend `(issuer, sub)` met een bestaand e-mailadres wordt geweigerd met de exacte Nederlandse foutmelding.
- 0113/0114 vergelijken met de opgegeven DDL, inclusief een trigger die `identity_link_events` append-only maakt en een hash-keten. Toegepaste migraties blijven onveranderd. Correcties komen in een nieuw delta-bestand.
- Proof validators afronden: JWKS/iss/aud/exp/nonce, numeriek GitHub-id, genormaliseerde Mastodon-origin, DID-only atproto.
- Step-up van maximaal 5 minuten verplicht. `state = HMAC(session_id || nonce)`. Een meldingsmail met eenklik-intrekken via GET-bevestiging en POST-wijziging.
- Tests: weigeren van automerge, state-binding, step-up-venster, hash-keten.

## Fase 3: IdP hardening
- Pairwise `sub` per sector-host. `subject_type` op `oauth_clients` (bestaande clients `public`, nieuwe clients `pairwise`). Discovery bijwerken.
- Refresh-families met hergebruikdetectie: de hele familie wordt ingetrokken. Alleen bij consent voor `offline_access`.
- Nieuw: `POST /api/public/oauth/revoke` (RFC 7009), introspect afronden (RFC 7662), `GET /oauth/end-session`.
- `iss` in de autorisatierespons (RFC 9207), `prompt`, `max_age`/`auth_time`, `acr` voor passkey.
- `/studio/account`: lijst van verbonden apps met een knop om toegang in te trekken.
- Tests: pairwise-determinisme, rotatie en hergebruik, revoke en introspect, redirect-validatie bij logout.

## Fase 4: Namespace & innovaties
- `0116_reserved_brands.sql` + `src/lib/reserved-brands.ts` `isReservedName()`, toegepast op handles, aliassen en workspace-slugs (via `workspace-rules.ts`). Alleen een admin kan een naam vrijgeven.
- Free-workspaces krijgen een slug met een willekeurige suffix van 4 tekens. Plus/Pro krijgen een schone slug (via `entitlement-engine`).
- DNS-claim: PSL via `tldts`, TXT-record `_rout.<domein>`, link `provider='domain'` + badge, cron-route met geheime header en 30 dagen respijt.
- Passkey-first login met Conditional UI. `PasskeysPanel` in `/studio/account`.
- Data Vault: ZIP-export (`jszip`) van alleen de eigen data. Zelf verwijderen met step-up, 7 dagen `pending_deletion`, daarna een cron-purge en een ondertekend audit-event.
- Scope-switcher in de bovenbalk met plan. `/studio/account` en `/studio/w/$slug/settings` strikt gescheiden. Workspace-quotum in Bestanden en media.

## Fase 5: Database
- RLS-policies voor de 77 tabellen zonder policy, op basis van `rout_app` + `current_setting('rout.user_id', true)`, in een nieuwe migratie.
- FK `public.users.id -> neon_auth."user".id ON DELETE CASCADE` na een controle op wezen. `password_hash` eerst niet meer lezen en daarna droppen in een aparte migratie.
- Snapshot en `db-types.gen.ts` regenereren via de replay.

## Acceptatie
- `tsgo --noEmit` 0 fouten, inclusief de bestaande fout op regel 239. Volledige `vitest run` groen, inclusief `no-runtime-ddl`. Nieuwe migraties met 4 cijfers.
- `roadmap.md` en `AGENTS.md` bijgewerkt.

## Blokkades (buiten code)
- Neon-database koppelen aan dit project. Nodig voor de live migratie en voor ingelogde end-to-end tests.
- Secrets: `ROUT_PROVIDER_PAIRWISE_SECRET`, `ROUT_PROVIDER_SIGNING_KEK`, `BETTER_AUTH_SECRET`, `LOVABLE_CRON_SECRET`.
- De Vercel-, seal- en REVOKE CREATE-taken blijven bij jullie.

Omvang: dit zijn meerdere grote rondes. Ik werk fase per fase en meld na elke fase de status.
