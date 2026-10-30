# Roadmap
## Master directive: Sovereign Identity & Enterprise (30 oktober 2026)
- [x] Fase 2: identity_links + append-only events (db/0113/0114), automerge uit, proofs (bestond bij import; geverifieerd via tests)
- [x] Fase 3a: pairwise, refreshfamilies, revoke, introspect (bestond), end-session route + discovery-velden
- [x] Fase 3b: post_logout_redirect_uris beheren in console; verbonden apps intrekken in /studio/account (bestond)
- [x] Nulmeting 30/10: tsgo 0 fouten, 865 tests groen na snapshot-refresh (0117/0118)
- [x] Fase 4a: merkbescherming (db/0116, isReservedName op handles/aliassen/workspaces) + namespace matrix (gratis = 4-teken suffix)
- [x] Fase 4b: schone slug bij Plus/Pro (met merkvrijgave), Team naar /studio/w/$slug/settings, workspace-quotum in Bestanden en media (30/10)
- [x] Fase 4c: db/0122 suffix-trigger + root-alias (rout.be/<naam>, Early Verified telt mee), workspace-instellingen met naam/adres/team/domein/gevarenzone, menulabels + schild-icoon
- [x] Taak 5: dashboard al één query; db/0123 indexen + plus als plan; 60 s SWR-cache per gebruiker+scope
- [x] Taak 6: Snapchat zonder sleutels veilig, duidelijke Scaleway-melding, seal-script klaar
- [x] Taak 7a: migraties 0118–0123 + RLS-policies op Neon toegepast
- [ ] Taak 7b: CREATE intrekken, BYPASSRLS/password_hash weg — wacht op deploy naar rout.be + akkoord gebruiker
- [x] Fase 5: db/0120 RLS-policies (70 tabellen, geheime tabellen bewust dicht), db/0121 users.auth_user_id → neon_auth.user (cascade), password_hash gemarkeerd als verouderd; snapshot via replay
- [x] tsgo 0 fouten, 861 tests groen, snapshot via scripts/schema-replay-snapshot.ts
- [ ] Acceptatie live: volledige Vitest-suite, replay/catalog/no-runtime-DDL en ingelogde end-to-end controles
- [ ] Infra buiten code: signing KEK op Vercel, bestaande keys verzegelen en public CREATE-recht intrekken

- [x] Enterprise booking: publieke intakevragen en veilige opslag (intake.ts + tests)
- [x] Enterprise booking: capaciteit en uitzonderingen (gedeelde plaatsen, tests)
- [x] Smart widget: drie vrije tijden en vooraf gekozen boekingscontext (BookingCard)
- [ ] Nieuwe migraties uitvoeren en volledige scope/RLS-audit verifiëren
- [ ] Preview-testaccount seeden en ingelogde workspace/tabs/0 MB-upload controleren
- [x] Nieuwe regeltests en architectuurnotities afronden
- [x] Fase 1: kleinere rondleiding-knop, Coach verkleint tot bolletje met %-ring
- [x] Fase 2: één Coach-score met checklist (verificatie + extra pagina meegeteld)
- [x] Fase 3: opslaglimiet op alle uploadpaden; video-links gevalideerd; concept/publiceren bestond al
- [x] Fase 4: Boekingen in Pagina-Wisselaar met Inhoud | Vormgeving | Statistieken
- [x] Fase 5: eigen status, API-sleutel, privacyregels, publiek endpoint
- [ ] Migratie db/106 draaien (wacht op database-sleutel; tabel wordt ook automatisch aangemaakt)
- [ ] Video-upload (Pro) naar Scaleway: wacht op opslagsleutels om te testen
- [x] Logo's Mastodon/wsocial.eu overal gelijk, naam "wsocial.eu"
- [x] Bovenbalk-glitch in venster Live integratie toevoegen (titel botst niet meer met sluitknop)
- [ ] Snapchat-koppeling testen — wacht op SNAPCHAT_CLIENT_ID/SECRET
- [x] Mastodon rel="me" verificatie bij Identiteit (bestond, getest)
- [x] Scope-wisselaar in profielmenu op alle pagina's
- [x] Workspace publieke pagina rout.be/w/slug (slug: min 3, a-z0-9-, gereserveerde woorden)
- [x] Links/statistieken/instellingen per scope (dashboard-totalen per scope, workspace-instellingen apart)
- [x] Rondleiding als compact (?) icoon
- [x] typecheck + tests
- [ ] db/107 migratie draaien (wacht op database-sleutel)

- [ ] db/0120 + db/0121 op Neon draaien — wacht op live databasesleutel; rls-audit pas zinvol als rout_app geen bypassrls meer heeft
- [ ] password_hash definitief verwijderen — pas na deploy en wanneer niemand nog met het oude wachtwoord inlogt

## Import-ronde (okt 2026)
- [x] Project geïmporteerd, Neon gekoppeld, 801 tests groen
- [x] Testaccount test_preview@rout.be (bestond al; wachtwoord vernieuwd met --rotate) en ingelogd in preview
- [x] Ingelogde controles: workspace-switch, Pagina-Wisselaar 3 tabs, 0 MB-upload melding
- [x] Publieke boekingspagina: intakevragen + gekozen tijd uit widget end-to-end (subpagina-routes hersteld)
- [x] RLS-audit gedraaid: 79 tabellen RLS aan, 77 zonder policies, rout_app omzeilt RLS (beslissing gebruiker nodig)
- [x] Bestanden en media toont in workspace het workspace-quotum
- [x] Statistieken per scope; Studio-profiel in workspace volgt de bestaande scope-routes

## RFC-001 Blueprint (wacht op goedkeuring Lead Architect)
- [x] Blauwdruk geschreven (SSOT, IdP, Identity Graph) — /mnt/documents/ROUT-Architectural-Blueprint.md
- [x] Fase 0: migratievolgorde numeriek, signing key versleutelen + roteren, onbekende kid weigeren
- [ ] Legacy signing key verzegelen (`bun scripts/seal-signing-keys.ts`) — wacht op deploy van deze code naar rout.be + ROUT_PROVIDER_SIGNING_KEK op Vercel en preview
- [ ] rout_app CREATE-recht op public intrekken — wacht op deploy naar rout.be (oude code voert nog DDL uit)
- [x] Fase 1: SSOT-opruiming, runtime-DDL bevriezen, baseline + schema-snapshot + db-types, replay-test in CI
- [x] Fase 2: identity_links + e-mail-automerge uit
- [x] Fase 3: IdP-uitbreidingen (pairwise sub, refresh/revoke/introspect, end-session)
- [x] Fase 4: Namespace Matrix + reserved brands, DNS-claims, Data Vault, /studio/account vs /studio/w/$slug/settings

## Context-menu & instellingen (30/10)
- [x] Profielmenu context-bewust (badge + plan, workspace-links, Account & Beveiliging onderaan)
- [x] /studio/account als globale pagina, /settings verwijst door, ontwerpsjablonen naar Studio Vormgeving
- [ ] Dashboard-performance: blauwdruk wacht op goedkeuring (/mnt/documents/ROUT-Dashboard-Performance-Blueprint.md)
- [x] password_hash: code op Better Auth, db/0124 drop-migratie geschreven
- [x] Neon gekoppeld; rout_app heeft al geen CREATE; db/0124 (10 oude wachtwoorden naar Better Auth) toegepast
- [ ] db/0125 kolom droppen — wacht tot rout.be (Vercel) de nieuwe code draait
- [ ] NOBYPASSRLS — wacht op per-request rout.user_id in neon.ts + RLS op users/workspaces e.a. (29 tabellen)
- [ ] Signing keys verzegelen op Vercel — wacht op ROUT_PROVIDER_SIGNING_KEK in productie
- [x] Mobiele Studio-kop compact (<120px): profielkeuze als pill, URL/Profiel-knop verbergen, Verwerpen als prullenbak met bevestiging, één knoppenrij
- [x] RLS-context: rout.user_id/rout.workspace_id per verzoek via neon.ts
- [x] db/0126 RLS-regels voor de 29 tabellen zonder RLS
- [x] Script om NOBYPASSRLS pas na geslaagde test te zetten
- [x] Signing keys: verzegeling, exacte kid en levenscyclus bestonden al
- [ ] 1 bestaande signing key verzegelen — wacht op ROUT_PROVIDER_SIGNING_KEK
- [x] Vormgeving: scope-balk (Alle/Links/Boekingen/Prikbord/Live-status/Socials) met overrides + herstel
- [x] Vormgeving: glasstijlen (solide, frosted, obsidian, prism) + sliders + toepassen-op + fallback

## RFC-002 + UI-batch (30/10, 17:48)
- [x] F1 hash-chained security_audit_logs (db/0127) + append-only trigger + HMAC checkpoint-cron (365d retentie, checkpoints permanent)
- [x] F2 ensureStepUpSession (120s, passkey/TOTP, e-mail alleen als fallback) op vault export, account delete, client secrets, teamrollen + modal + tests
- [x] F3 sliding-window rate limiter (Neon) op publieke endpoints + CSP publieke profielen
- [x] F4 X-Rout-Signature webhooks + retry-queue; client_credentials (15 min)
- [x] Platform-iconen (PeerTube, Vimeo, Dailymotion, Tumblr, Lemmy, Misskey) + booking-icoon
- [x] /studio/account: identiteitskaart + 'Sociale accounts & verificatie' weg
- [x] €3,99-verificatie uit Studio en vinkje-venster; Pioneer-melding met gratis paspoortscan
- [ ] Bestaande betaalde vinkjes intrekken tot paspoortscan (is_paid/is_early_believer telt nog als geverifieerd op ~10 plekken) — wacht op akkoord
- [x] Vertalingen accountpagina
- [ ] Beveiligingscentrum (3 lagen) + user_mfa_methods (db/0130) + herstelcodes met step-up + SMS-2FA (wacht op SMS-dienst)
- [x] Sticky tabbalken + actieve tab in beeld
- [x] Custom domain root redirect (db/0128) + Studio-keuze
- [x] Scoped theme: overrides ook voor vorm/stijl/typografie/radius/kleuren (Studio + publiek profiel)
- [x] Neon gekoppeld (31/10): 141 tabellen, alleen 0125 bewust open
- [ ] Webhook-eindpunten beheren in console (UI + URL-check tegen privé-adressen)
- [x] 0128 + 0129 op Neon toegepast (migrate-gateway --only=...)
