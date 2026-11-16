DPL 2026 — Supabase frontend connection

This package contains three replacement frontend files:
- config.js: points the frontend to the deployed Supabase Edge Function.
- script.js: public website API client compatible with Supabase.
- admin.js: admin dashboard API client compatible with Supabase.

DEPLOY STEPS (GitHub Pages repository root):
1. Download/backup the current config.js, script.js and admin.js first.
2. Replace ONLY those three files with the files in this package, keeping these exact filenames and in the same folder as index.html and admin.html.
3. Do not change index.html, admin.html, style.css, admin.css, or assets.
4. Commit/push to the GitHub Pages branch.
5. Open the public website in a private/incognito window and check the public page loads.
6. Open /admin.html and sign in with the existing dpladmin credentials. Do not share the password or session token in chat.

ROLLBACK: restore the three backed-up original files. This returns the frontend to the Apps Script endpoint.

IMPORTANT: This package does not contain any Supabase service-role key or other secret. Never put service-role keys in website files.
