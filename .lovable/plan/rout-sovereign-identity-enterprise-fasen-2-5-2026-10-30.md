# ROUT — Sovereign Identity & Enterprise, fasen 2–5

## Resultaat
Een expliciete, cryptografisch onderbouwde identity graph; privacyvriendelijke OIDC; enterprise-naamgeving; passkey-first accountbeveiliging; een veilige Data Vault; en aantoonbare tenant-isolatie. Neon en Better Auth blijven behouden. Er wordt geen Lovable Cloud- of Supabase-laag toegevoegd.

## Vastgestelde uitgangspunten
- De nulmeting: **147 testbestanden, 839 tests geslaagd**, inclusief migratiereplay en no-runtime-DDL.
- De bestaande migraties lopen tot `0112`; toegepaste SQL blijft onveranderd.
- E-mailautomerge bestaat niet alleen in Better Auth, maar ook in de accountbridge en fediverse-onboarding. Deze paden worden samen aangepakt.
- Better Auth en `public.users` gebruiken UUID’s, maar bestaande accounts hebben niet noodzakelijk dezelfde UUID. Een directe nieuwe FK op `public.users.id` is daarom geen veilige éénregelige wijziging.
- Bestaande Mastodon-identiteiten zijn deels op veranderlijke handles gebaseerd; historische gegevens vormen niet automatisch een gevalideerd cryptografisch bewijs.
- RLS is op veel tabellen ingeschakeld zonder policies; de historische audit meldt dat `rout_app` RLS omzeilt. Nieuwe policies alleen maken de toepassing nog niet geïsoleerd.
- De huidige export en verwijdering zijn onvolledig; enkele verwijderpaden werken vanuit de browser. Die worden vervangen, niet aangevuld met een tweede autoriteit.

## 1. Fase 2 — Identity graph en accountovernamepreventie
- Schakel Better Auth e-mailautomerge uit en beveilig ook de bridge, fediverse-login en directe link-endpoints. Een onbekend extern subject krijgt bij e-mailconflict exact de opgegeven Nederlandse foutmelding; een verified e-mail is nooit toestemming om eigendom te wijzigen.
- Maak `0113_identity_links.sql` met het gevraagde model, unieke `(issuer, provider_sub)`, standaard `login_enabled=false`, beperkte rechten en append-only, hash-geketende events. Serialiseer mutaties per identiteit zodat gelijktijdige koppelingen geen eigendom of auditketen kunnen beschadigen.
- Maak `0114_identity_links_backfill.sql`. Neem bestaande accounts conservatief over, met herkomst en conflictregistratie. Onvoldoende bewezen of ambiguë historische rijen krijgen geen verzonnen bewijs en worden niet automatisch login-enabled; bestaande geldige loginmethoden behouden compatibiliteit totdat expliciete migratie/reverificatie plaatsvindt.
- Voeg server-only validators toe voor OIDC via een bewezen JWT/JWKS-bibliotheek, GitHub PKCE plus numeriek account-ID, Mastodon instance-origin plus account-ID en AT Protocol DID. Weiger onveilige hosts, redirects naar private adressen en onbeperkte externe fetches.
- Maak sessiegebonden, kortlevende linkoperaties: verse passkey/TOTP/e-mailcode van maximaal vijf minuten, cryptografisch gebonden state, provider/target-binding, expiratie en eenmalige consumptie. Bescherm alle bestaande koppelknoppen via dezelfde serverregels.
- Verstuur de notificatie via `sendLocalizedEmail`. De intreklink opent een bevestiging op GET; uitsluitend POST trekt daadwerkelijk in, zodat e-mailscanners geen koppeling verwijderen.
- Maak ontkoppelen, login-opt-in en laatste-loginmethodecontrole atomair. Neem passkeys en herstelmethoden mee. Voorkom dat merge- of conversiecode identity ownership herschrijft buiten deze regels.

## 2. Fase 3 — Sovereign IdP
- Voeg `oauth/subject.ts` toe met de gevraagde HMAC-formule en server-only secret-invoer. Bestaande clients blijven `public`, nieuwe clients standaard `pairwise`.
- Pin de sector per client aan de geregistreerde redirect-host. Voor pairwise clients met meerdere redirect-hosts is een expliciete consistente sectorregistratie nodig; subjectwijzigingen na aanpassen van redirects worden niet stilzwijgend toegestaan.
- Maak `0115_oauth_refresh_tokens.sql` met refreshfamilies, uitsluitend tokenhashes, expiratie en consumptie/revocatie. Ondersteun `offline_access` alleen na expliciete consent. Rotatie is transactioneel; hergebruik trekt de volledige familie in, ook onder gelijktijdige verzoeken.
- Scheid ID-tokens van access-tokens. Controleer issuer, audience, tokengebruik, claimtypen, client/accountstatus en actieve grant. UserInfo gebruikt het interne user-ID uitsluitend server-side en retourneert hetzelfde pairwise subject als het ID-token.
- Voeg revoke en confidential-client introspection toe met correcte clientauthenticatie, inputlimieten, rate limits en OAuth-foutcodes. Consent-intrekking stopt ook reeds uitgegeven access-tokens, refreshfamilies en open autorisatiecodes.
- Voeg `/oauth/end-session` toe met ondertekende `id_token_hint`-validatie en apart geregistreerde post-logout-URI’s. Alleen een ongeldige/ontbrekende hint mag geen willekeurige redirects of accountlogout veroorzaken.
- Valideer `response_type`, `prompt` en `max_age` server-side op alle autorisatiepaden. Sla echte sessiegebonden `auth_time` en bereikte assurance op; geef passkey-ACR uitsluitend na aantoonbare passkey-authenticatie. Voeg `iss` toe aan autorisatieresponses.
- Voeg actieve verbonden apps en directe intrekking toe aan de globale accountpagina; pas discovery en integratievoorbeelden pas aan wanneer de endpoints werken.

## 3. Fase 4 — Enterprise naamgeving, DNS en accountbeheer
- Maak `0116_reserved_brands.sql` en één client-safe `isReservedName()`-contract, met server-side databasecontrole en adminvrijgave na verificatie. Gebruik dezelfde regels voor persoonlijke handles, aliassen, workspaces en domeinclaims. Pas bestaande tests die merkbescherming tegenspreken aan.
- Free workspaces krijgen vier cryptografisch willekeurige alfanumerieke suffixtekens; Plus/Pro mogen schone slugs of root-aliassen. Gebruik rejection sampling en database-uniciteit, ook bij gelijktijdige creatie. Bestaande publieke adressen worden niet stilzwijgend hernoemd.
- Gebruik een PSL-bibliotheek met private suffixes en IDNA-normalisatie. Alleen het rechtmatige registrabele domein kan een root-handle ontgrendelen; `github.io`-huurders kunnen geen generieke providernaam claimen.
- Voeg DNS-challenges, identity links, `dns_verified` en hercontrole toe. Maak `/api/public/cron/verify-domains` met cron-authenticatie, begrensde batches, expliciete foutstatus en dertig dagen respijt. Handlevrijval verwijdert uitsluitend de betreffende DNS-claim, nooit een later anderszins goedgekeurde handle.
- Maak passkeys de primaire loginactie en activeer Conditional UI waar ondersteund. Behoud wachtwoord/e-mailcode als terugval. Hergebruik `PasskeysPanel` en voeg hernoemen toe.
- Maak één Vault-exportservice achter de sessiebeveiligde ZIP-download. Exporteer de opgegeven categorieën zonder credentials, tokens, signing secrets of andermans gevoelige intake. Queryfouten worden niet als lege, succesvolle export verborgen.
- Maak accountverwijdering met verse passkey/2FA, zeven dagen bedenktijd en een annuleermogelijkheid. Nieuwe chronologisch genummerde migraties bevatten de lifecycle en purgequeue. Databasepurge is atomair; objectopslagcleanup is retrybaar. Een laatste workspace-eigenaar moet eerst eigendom overdragen of de workspace afwikkelen.
- Bewaar na purge uitsluitend een minimaal ondertekend auditbewijs zonder persoonlijke gegevens. Identity-audits blijven append-only tijdens de accountlifecycle; purge gebeurt uitsluitend via de afgeschermde purgeprocedure, niet via gewone app-DELETE.
- Voeg `/studio/account` als globale accountpagina toe en `/studio/w/$slug/settings` als workspace-instellingen. De context-switcher toont scope en plan. Media, links, statistieken en instellingen lezen expliciete workspacegegevens en het workspacequotum; globale accountgegevens blijven persoonlijk.

## 4. Fase 5 — RLS en gebruikersconsolidatie
- Maak een volledige tabelinventaris met eigenaar-, profiel-, workspace-, admin-, publiek- en systeemtoegang. Voeg in nieuwe deltamigraties strikte policies toe aan iedere RLS-tabel zonder policies; geen generieke permissieve fallback.
- Stel `rout.user_id` en eventuele workspacecontext uitsluitend vanuit een geverifieerde sessie in, transaction-local en in dezelfde databasebatch als de beschermde queries. Pas beide Neon-transports aan; een losse SET-call is niet voldoende.
- Test met een echte non-owner/non-bypass `rout_app`-rol. Auth, OIDC, cron en publieke profielreads krijgen expliciete afgeschermde toegang; runtimecredentials worden niet gebruikt als migratierol. Trek bypass niet blind in voordat deze paden zijn omgezet en getest.
- Consolideer gebruikers-ID’s met behoud van `public.users.id` en alle bestaande app-FK’s. Maak eerst een conflictinventaris en een expliciete, niet op e-mail afgeleide mapping. Migreer Better Auth-referenties naar het stabiele app-ID waar veilig; ambiguïteiten blokkeren migratie in plaats van gegevens te verliezen. Daarna de gevraagde `public.users(id) → neon_auth.user(id) ON DELETE CASCADE` toevoegen.
- Migreer alle nog actieve `password_hash`-consumenten en credentialrecords voordat de legacykolom verdwijnt. Onverenigbare legacy hashes worden niet blind als Better Auth-wachtwoord gekopieerd; daarvoor is gecontroleerde wachtwoordherstel nodig.
- Houd nieuwe migraties uniek, viercijferig en numeriek geordend. Registreer structurele regels in de toepasselijke `AGENTS.md`.

## Technische validatie en oplevering
- Voeg gedragstests toe voor iedere opgegeven veiligheidsregel en termijn: vijf minuten step-up, refresh-reuse, default login-disabled, public/pairwise, vier suffixtekens, dertig dagen DNS-respijt en zeven dagen verwijdering.
- Test providerproofs met geldige en ongeldige signatures/claims, state-replay, sessiemismatch, issuer-collisies, conflicten en gelijktijdige mutaties.
- Test revoke/introspect/end-session, ID-token-as-bearer refusal, consentintrekking en cross-client/cross-tenant weigering.
- Test SQL-replay, auditketen, append-only afdwinging, FK-cascade, non-bypass RLS en purge zonder andermans data te verwijderen.
- Na iedere toegepaste migratie: `bun scripts/schema-snapshot.ts`; snapshot en gegenereerde types blijven samen synchroon. Zonder live verbinding kan alleen lokale replay worden bevestigd; live schema-check blijft expliciet open.
- Draai de volledige Vitest-suite. De automatische Lovable-type/buildcontrole moet foutloos zijn; geen handmatige build/typecheck naast de harness. Rapporteer alleen werkelijk geobserveerde resultaten, niet “100% voltooid” op basis van nieuwe bestanden alleen.
- Verifieer ingelogd: bestaande login, accountconflict, expliciete koppeling, consent/revoke, workspacequota, export en deletion-aanvraag/annulering. Providers, mail en opslag zonder werkende configuratie blijven expliciet ongeverifieerd.
- Werk `roadmap.md` bij per daadwerkelijk afgeronde fase en benoem resterende blockers.

## Externe afhankelijkheden
De sandbox heeft momenteel geen geconfigureerde directe Neon-URL of Neon-connectorcredential. Live migraties, backfill, snapshotcontrole en ingelogde end-to-end acceptatie vereisen herstel van de bestaande Neon-verbinding; geen vervangende database wordt aangemaakt.

De drie opgegeven DevOps-acties blijven buiten deze codeopdracht: KEK op Vercel, legacy signing keys eenmalig verzegelen na deploy en `CREATE` op `public` intrekken. Nieuwe secrets worden uitsluitend via beveiligde instellingen toegevoegd en in `ENVIRONMENT.md` plus `.env.example` gedocumenteerd.