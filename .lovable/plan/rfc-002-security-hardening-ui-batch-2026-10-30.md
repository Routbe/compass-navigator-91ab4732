# RFC-002 security hardening + UI batch

Already done (I will check it, not rebuild it): hash-chained audit log `db/0127` with the append-only trigger and the HMAC checkpoint cron (365-day retention, checkpoints kept permanently), the compact mobile Studio header, and the scope bar in Vormgeving. Step-up files already exist (`step-up.server.ts`, `StepUpDialog`) and get completed in step 2.

No AI Gateway or outside model sees security data: risk rules stay local and deterministic.

## Order of work (after each step: tsgo + Vitest, roadmap.md updated)

1. **Check audit log (F1):** the checkpoint also goes to structured stdout; tests for the UPDATE/DELETE/TRUNCATE refusal and for the signature.
2. **Step-up guard (F2):** `ensureStepUpSession` (max 120 s). Passkey/TOTP are required. Email code is allowed only as a fallback for accounts without passkey/2FA, with an urgent prompt to set up a passkey. The guard goes on vault export, account deletion, OAuth client secrets (create/rotate/view) and workspace role changes or member removal. The server returns 401 `STEP_UP_REQUIRED`, the client shows the modal and retries the action. One test per action (blocked without a recent step-up).
3. **Rate limiting + CSP (F3):** a sliding window in a Neon table (new migration). It applies to QR upload, alias links, booking emails, and OAuth authorize/token. A strict CSP without inline scripts on public profiles, plus tests.
4. **Webhooks + M2M (F4):** `X-Rout-Signature` (HMAC-SHA256 + timestamp), with a retry queue using exponential backoff (table + cron). A `client_credentials` grant whose tokens are valid for exactly 900 s, plus tests.
5. **Icons:** a calendar icon for booking, and brand logos for PeerTube, Vimeo, Dailymotion, Tumblr, Lemmy and Misskey.
6. **/studio/account cleanup:**
   - Remove the "Sociale accounts & verificatie" block.
   - If verified, show a status card "Identiteit Geverifieerd" instead of buttons; otherwise offer Didit/W Identity.
   - Remove every mention of Stripe or a bank transfer as identity verification.
7. **Security center:**
   - Three layers: Aanmeldmethodes (passkeys, password, magic link), 2FA (TOTP, SMS, email code) and Herstel (recovery codes, which need a step-up to generate).
   - `user_mfa_methods` table (migration), with a free choice of method at step-up and login.
   - Remaining English text translated into Dutch.
8. **Sticky tabs:** Studio and account tab bars become sticky with a warm, blurred background (as a design token), and the active tab scrolls into view.
9. **Custom domain root:** migration `db/0128` with `root_redirect_type` (`profile_hub` by default, plus `custom_url`, `rout_main`, `none`) and `root_redirect_url`. The domain router handles `/` with a 302; short links keep working. A selector in Studio → Data & domein, with the URL validated through `safe-redirect`.
10. **Scoped theme:** extend overrides with button_shape/style, typography, border_radius and colors, falling back to global, via `theme-engine.ts` with tests. Plus the badge "● Unieke stijl".

## Technical notes
- Migrations are new 4-digit files from 0128; they get applied to Neon only after you approve, followed by a snapshot refresh.
- Secrets that may be needed: `ROUT_AUDIT_SIGNING_SECRET` (check whether it is set) and an SMS provider for SMS 2FA. Without the provider, SMS is shown as "not available".
- This is a lot of work: realistically several messages. I will report what is finished at the end of each message.
