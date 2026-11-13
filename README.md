# Dariyapur Premier League — DPL 2026

This is an upgrade of the original DPL GitHub Pages website. The existing branding, hero animation, prize presentation, organiser photograph, sponsors, contact details and core tournament information have been retained. The Google Form embed has been replaced with a custom registration and payment workflow, and a separate admin interface has been added.

## Project structure

```text
/
├── index.html             # Public DPL website
├── style.css              # Existing styles + responsive tournament components
├── script.js              # Existing hero motion + public API integration
├── config.js              # Public Apps Script endpoint (not a secret)
├── admin.html             # Separate admin login/dashboard
├── admin.css              # Admin responsive styles
├── admin.js               # Admin UI/API client
├── assets/
│   ├── dpl-cricket-action.gif
│   └── organiser-photo.jpg
└── backend/
    └── Code.gs            # Google Apps Script backend
```

## Security model

- The Google Sheet and payment-proof Drive folder must remain private.
- GitHub Pages contains only the deployed Apps Script URL. It must never contain admin passwords, password hashes, session signing secrets, or write credentials.
- Passwords are hashed server-side with PBKDF2-HMAC-SHA256 and a per-account random salt (120,000 iterations).
- The backend issues random session tokens, stores only their SHA-256 hashes, checks expiry and account status, and enforces roles on every protected action.
- Main Admin has full management permissions. Scoring Admin is allowed only match listing and live-scoring operations.
- Payment status starts as `PENDING`; only a Main Admin can verify or reject it.
- Public APIs can submit applications, payment details, comments and reports, but cannot write directly to Sheets.
- Google Apps Script web apps execute with the owner's permissions. Protect the spreadsheet, Apps Script project and deployment ownership accordingly.

## 1. Create the private Google Sheet

1. Create a new Google Sheet named `DPL 2026 Tournament Database`.
2. Do not publish it to the web and do not share it publicly.
3. Open **Extensions → Apps Script**.
4. Replace the editor's contents with `backend/Code.gs` (or create `Code.gs` and paste the complete file).
5. Save the Apps Script project.
6. Run `setupDatabase` from the editor and approve the requested Google Sheets/Drive permissions. This creates the required tabs and stores the spreadsheet ID in Script Properties.
7. Return to the spreadsheet and confirm the tabs exist. Do not manually expose the sheet to website visitors.

The setup creates: Applications, Teams, Players, Payments, Matches, PlayingXI, LiveScore, BallByBall, PointsTable, Comments, AdminAccounts, AdminSessions, ActivityLogs and RateLimits.

## 2. Provision the first Main Admin

1. In Apps Script, open **Project Settings → Script Properties**.
2. Add `DPL_BOOTSTRAP_USERNAME` with your chosen initial username.
3. Add `DPL_BOOTSTRAP_PASSWORD` with a unique, strong password of at least 14 characters.
4. Save the properties.
5. Select and run `initializeMainAdmin` from the Apps Script editor. Authorise if prompted.
6. The function removes both bootstrap properties after provisioning. Do not paste the password into source code, README files, GitHub, or chat.
7. Sign in at `/admin.html` and change the password immediately.

If you lose the initial password, use the Apps Script editor and a controlled account-recovery procedure; do not add a public password-reset endpoint.

## 3. Deploy Apps Script API

1. In Apps Script choose **Deploy → New deployment**.
2. Select type **Web app**.
3. Set **Execute as: Me** (the database owner).
4. Set **Who has access: Anyone** so the public website can read the public scoreboard and submit public forms. This does *not* grant direct Sheet access; privileged operations still require a server-validated admin session and role.
5. Deploy and copy the `/exec` URL.
6. If the script changes later, choose **Deploy → Manage deployments → Edit** and create a new version of the same deployment.
7. Test the deployed URL by opening `YOUR_WEB_APP_URL?action=health`; it should return a JSON health response.

Apps Script web-app cross-origin behaviour can vary with account policy and browser. Test the actual deployed endpoint from your published GitHub Pages origin before announcing registration. If the browser blocks the response due to CORS or organisation policy, use a controlled same-origin proxy (for example Cloud Run) rather than weakening authentication or making the Sheet public.

## 4. Configure the public website

Edit `config.js` and replace the value of `API_URL` with the deployed Apps Script `/exec` URL. The URL is public by design; it is not an authentication secret. Keep the polling interval at 5–10 seconds (default 7 seconds).

Commit the project files to the root of your existing GitHub Pages repository, preserving the `assets/` and `backend/` folders. Enable GitHub Pages from the repository's `main` branch and root folder. The backend file is included for maintainers; the live API runs from Apps Script, not GitHub Pages.

## 5. Admin accounts and roles

- The first provisioned account is `MAIN_ADMIN`.
- Sign in at `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/admin.html`.
- Main Admin can create further `MAIN_ADMIN` or `SCORING_ADMIN` accounts, reset another administrator’s password, and enable/disable accounts from the Admins tab. Temporary passwords are shown once and must be delivered privately.
- Scoring Admin can list matches, load score state, update current players, record deliveries, undo the last delivery and change match status. The backend rejects access to application, payment, team, comments, admin and log resources.
- Both roles can change their own password from the dashboard; password hashes are never returned to the browser. Newly created/reset accounts must change their temporary password before accessing dashboard tabs.
- Sessions last eight hours. Signing out revokes the current session. Changing a password revokes existing sessions for that account.

## 6. Operational workflow

1. Applicants submit a team application and receive an Application ID.
2. Main Admin reviews Applications and selects or rejects each application. Selection generates a Team ID in the `HTK-2026-###` format.
3. Only selected teams are shown on the public website.
4. A selected team submits transaction ID, amount, date and payment proof. Proof files are stored in a private Drive folder created by the backend.
5. Payment status remains pending until Main Admin manually approves or rejects it.
6. Main Admin adds player records, selects each team’s Playing XI (11 players), and creates fixtures between selected teams.
7. Admin sets a match to Live, selects striker, non-striker and bowler, and records ball events. Score totals and legal-ball overs are calculated server-side; undo marks the latest delivery as undone and rebuilds aggregate totals.
8. Public score, basic batting/bowling figures, fall of wickets, recent commentary, fixtures, selected teams, calculated win/tie points and comments are refreshed by the website client. Match results are entered by Main Admin after a match is marked Completed.

## Important implementation status and limitations

This is a working first implementation of the public flows, private backend foundation, admin authentication/permissions, manual payment review, team selection, fixture creation, basic ball-by-ball scoring, undo, comments and public polling. It is **not yet a fully production-certified cricket scoring engine**. Before a live tournament, complete and test the remaining cricket rules and workflows: wicket dismissal type and incoming batter workflow, second-innings/innings transition, complete extras and dismissal accounting, net-run-rate calculations, password reset/deactivation for other admins, stronger abuse controls (CAPTCHA and edge rate limiting), and independent security review.

The browser-side form validates inputs for usability; the Apps Script backend validates again. Payment proof is not made public. Comment filtering is a basic offensive-word check and should be supplemented with moderation and abuse controls before public launch.

## Testing checklist before launch

- [ ] Run `setupDatabase` and verify all tabs/headers.
- [ ] Provision Main Admin using Script Properties; confirm the properties are removed.
- [ ] Confirm wrong passwords fail and correct login works.
- [ ] Confirm Scoring Admin cannot call Main Admin-only endpoints directly.
- [ ] Submit an application; verify its ID and row in Applications.
- [ ] Confirm an unselected application cannot submit payment.
- [ ] Select an application; verify the Team ID and public selected-team listing.
- [ ] Submit a proof file; confirm the Drive file is private and payment remains PENDING.
- [ ] Approve/reject payment as Main Admin; confirm Scoring Admin is denied.
- [ ] Create a match, add players, record and undo scoring events; reconcile against a manual score sheet.
- [ ] Post/report/moderate comments and verify hidden/deleted comments are not public.
- [ ] Test the public website on desktop and mobile, including API refresh and network failure states.
- [ ] Review Apps Script execution logs, Google Sheet sharing and Drive folder permissions.

## Existing content preserved

The DPL hero, animated cricket GIF, prize values, organiser details and photograph, sponsors, contact numbers, tournament facts and original green/lime visual identity are retained from the supplied project. Confirm all tournament dates, venue, prize and payment details with the organisers before launch.

## Public website presentation updates
- The homepage hero uses three locally hosted WebP slides with a five-second transition and manual dot controls.
- Hero images are exported at quality 80 to reduce transfer size.
- The live-score section includes a manual refresh control and reflects the match status returned by the public API.
- Public comments are displayed five at a time and progressively revealed while scrolling. The existing Apps Script currently exposes comment posting/reporting; threaded replies require a backend schema/action update before they can be enabled safely.


## November 2026 public UI refresh

The refreshed `index.html` and `style.css` add a responsive hero composition and an animated, accessible “Dates to be announced” announcement. Existing API behaviour and JavaScript are retained. Keep your existing `assets/` directory and its hero WebP images when copying these files into your GitHub Pages repository. The admin files and public `config.js` are included unchanged; no backend or database changes are required for this visual update.


## Final UI refinement
- Removed repeated tournament-date/coming-soon messaging; the hero now has one compact date announcement.
- Reshaped the hero image and improved the desktop-to-mobile stacking behaviour.
- Added a subtle glowing pulse to the no-live-match indicator.
- Added an independently scrollable comments feed.
- Improved the payment proof file chooser and form spacing.
- Improved contrast in the fixtures and points-table section.
- Added reduced-motion fallbacks.

When deploying, retain the original `assets/` folder (including all hero WebP images and the organiser photograph) and keep your existing backend deployment and configuration values.
