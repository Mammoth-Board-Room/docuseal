# AGENTS.md

## Cursor Cloud specific instructions

DocuSeal is a single Ruby on Rails 8 monolith (open-source document signing). Ruby **4.0.5** runs via `rbenv` (set as the global version); `~/.bashrc` already sources `rbenv init`, so interactive shells have `ruby`/`bundle` on `PATH`. In non-interactive shells prepend `export PATH="$HOME/.rbenv/shims:$HOME/.rbenv/bin:$PATH"`. `node` (v22) + `yarn` (1.x, via nvm) are used for assets.

The startup update script only refreshes dependencies (`bundle install`, `yarn install`). Everything below (services, DB, assets) must be started/run manually per session.

### Services must be started manually (not auto-started on boot)
- **PostgreSQL 16**: `sudo pg_ctlcluster 16 main start` (a superuser role `ubuntu` and the `docuseal_dev` / `docuseal_test` databases already exist from setup). The default `config/database.yml` connects over the local socket as the OS user — no `DATABASE_URL` needed for dev/test.
- **Redis**: Do **not** start a standalone `redis-server`. In dev/single-tenant mode the app derives a password-protected `REDIS_URL` (`redis://default:<sha1>@0.0.0.0:6379/0`) and the Puma `redis_server` plugin forks its **own** Redis on 6379 after boot (see `config/dotenv.rb` + `lib/puma/plugin/redis_server.rb`). A separate Redis on 6379 causes a port clash that makes the plugin kill Puma on startup. RSpec does not need Redis (Sidekiq runs inline/fake in test).

### Run the app (development)
`bundle exec foreman start -f Procfile.dev` starts Puma on `http://localhost:3000` (with embedded Redis + Sidekiq) and the Shakapacker webpack-dev-server on 3035 (compiles assets on the fly). First boot takes ~10s to compile assets.
- First run shows a `/setup` wizard to create the first admin/account; afterward `/` requires login. The sign-in path is `/sign_in` (Devise is mounted at `path: '/'`, so `/users/sign_in` does NOT exist).

### Lint / Test / Build (commands in `.github/workflows/ci.yml`)
- Rubocop: `bundle exec rubocop`
- ERB lint: `bundle exec erb_lint ./app`
- ESLint: `./node_modules/eslint/bin/eslint.js "app/javascript/**/*.js"` (the `yarn eslint` script also passes `--fix` and lints `.vue`)
- Brakeman: `bundle exec brakeman -q --exit-on-warn`
- RSpec: `RAILS_ENV=test bundle exec rspec` (system specs use Cuprite + headless Chrome, already installed at `/usr/local/bin/google-chrome`). Precompile assets first for system specs: `RAILS_ENV=test bundle exec rake assets:precompile`.

### Native libraries (already installed in the snapshot)
`libvips` (ruby-vips), `libpdfium.so` in `/usr/lib` (PDF rendering), leptonica. The `onnxruntime` gem (ML field detection) is lazy-loaded (`require: false`) and not needed for the core signup/template/signing flows.
