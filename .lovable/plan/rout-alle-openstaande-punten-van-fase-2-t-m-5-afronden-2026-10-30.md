# ROUT: alle openstaande punten van Fase 2 t/m 5 afronden

## Stap 0: Database koppelen (eerst)
- Neon koppelen aan dit project en de secrets instellen. Zonder deze stap kan niets live getest worden.
- De interne secrets laat ik willekeurig genereren: `ROUT_PROVIDER_PAIRWISE_SECRET`, `ROUT_PROVIDER_SIGNING_KEK`, `BETTER_AUTH_SECRET`, `APP_SESSION_SECRET`, `LOVABLE_CRON_SECRET`.
- Daarna de migraties 0113 t/m 0116 en de nieuwe migraties uitvoeren met `db:migrate:gateway`. Vervolgens `schema-snapshot.ts --check` tegen live.

## Fase 3b: Login met ROUT
- In de console een veld om `post_logout_redirect_uris` te beheren. Die URI's worden gevalideerd via `redirect-match.ts`.
- In `/studio/account` een blok "Verbonden apps": een lijst van actieve consents (app, scopes, datum) met een knop "Toegang intrekken". Intrekken zet `revoked_at` op de consent en trekt ook de refresh- en access-tokens in.

## Fase 4b: Namespace en innovaties
- Admin-vrijgave van merknamen: een adminscherm met een term, een gebruiker en het bewijs. De serverchecks voor handles en slugs lezen `reserved_brand_releases` en laten alleen die gebruiker toe.
- Schone slug bij een upgrade naar Plus/Pro: een knop "Schoon adres claimen" in de workspace-instellingen, met de plan-check via `entitlement-engine`.
- DNS-claim:
  - In `/studio/account` een blok "Domein verifiëren" met het TXT-record `_rout.<domein>` en een HMAC-token.
  - De PSL-check gebeurt via `tldts`.
  - Bij succes: een `identity_links`-rij met `provider='domain'`, de badge `dns_verified` en de handle wordt vrijgegeven.
  - Cron `/api/public/cron/verify-domains`, beveiligd met `LOVABLE_CRON_SECRET`, met 30 dagen respijt. Daarvoor komt een nieuwe migratie voor `domain_claims`.
- Passkey-first login: het inlogscherm toont "Inloggen met passkey" als hoofdknop, met Conditional UI (`autocomplete="username webauthn"`). Wachtwoord en e-mailcode staan eronder.
- `PasskeysPanel` in `/studio/account`: passkeys toevoegen, hernoemen en verwijderen.
- Data Vault:
  - `GET /api/user/vault/export` geeft een ZIP met JSON van alleen de eigen data.
  - Account verwijderen met step-up van maximaal 5 minuten, waarna de status 7 dagen `pending_deletion` is (annuleren kan).
  - Cron-purge plus een ondertekend audit-event. Daarvoor komt een nieuwe migratie.
- Bovenbalk: een scope-switcher die de actieve scope en het plan toont.
- Scheiding: `/studio/account` toont alleen globale instellingen en `/studio/w/$slug/settings` alleen workspace-instellingen. "Bestanden en media" toont het workspace-quotum.

## Fase 5: Database
- Een nieuwe migratie met RLS-policies voor alle tabellen zonder policy. Die zijn op eigenaar gescoped via `current_setting('rout.user_id', true)`, of read-only waar de data publiek is. Dit eerst met een audit-query op live.
- Eerst controleren op wezen. Daarna de FK `public.users.id -> neon_auth."user".id ON DELETE CASCADE`.
- `password_hash`: de code leest het niet meer, en een aparte migratie dropt de kolom.
- Na elke migratie de snapshot en de types regenereren.

## Acceptatie
- `tsgo --noEmit` 0 fouten en `vitest run` volledig groen. Nieuwe tests voor consent-intrekking, merkvrijgave, DNS-token en PSL, de 7-dagen-deletie en de vault-scope.
- Ingelogde end-to-end controle in de preview: verbonden apps intrekken, een passkey toevoegen, een export downloaden, verwijderen en annuleren, en de scope-switch.
- `roadmap.md` en `AGENTS.md` bijgewerkt.

## Blijft bij jullie
- `ROUT_PROVIDER_SIGNING_KEK` op Vercel, `seal-signing-keys.ts` live uitvoeren, en `CREATE` intrekken voor `rout_app`.

Omvang: dit zijn meerdere grote rondes. Ik werk ze in deze volgorde af en meld na elke ronde de status.
