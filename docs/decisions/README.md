# Architecture decision records

One file per decision, numbered in the order they were made. Each record says what was decided,
why, and what it costs. A later record can supersede an earlier one; the old file stays, with its
status changed.

| # | Decision | Status |
|---|---|---|
| [0001](0001-supabase-backend.md) | Supabase is the backend | Accepted |
| [0002](0002-angular-ssr-from-the-database.md) | Recipe pages are server-rendered from the database | Accepted |
| [0003](0003-host-on-doks-with-opentofu-and-helm.md) | Host on DigitalOcean Kubernetes, set up with OpenTofu and Helm | Accepted |
| [0004](0004-recipe-submission-api-queue-later.md) | Recipes arrive through an API, shaped so a queue can go behind it later | Accepted |
