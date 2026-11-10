# ORORA website

React/Vite storefront and admin, Firebase data, Vercel APIs.

```sh
npm ci
npm run dev
npm run check      # unit/integration + lint + build + entry bundle budget
npx playwright install chromium  # once on a new test machine
npm run test:ui    # local mocked UI checks at 320/390/768/1440px
```

Production/runtime variables are configured in Vercel; do not commit credentials. The repository's CI tests use local/mocked data and do not create customer orders or send mail.

## Operations

- [Readiness, known production blockers, backup/restore and permissions migration](docs/PRODUCTION-READINESS.md)
- [UI/UX audit](docs/UI-UX-AUDIT.md)
- [Product/admin setup](docs/PRODUCTS-SETUP.md)
- [Orders and mail](docs/ORDERS-SETUP.md)
- [Analytics](docs/ANALYTICS.md)

**Firestore rules migration:** the stricter rules in this repository require an owner admin role to be provisioned before deployment. Read the readiness guide first. Git/Vercel deployment does not deploy Firebase rules. Backup/restore and admin-grant tools default to dry-run/validation and are not executed against production by CI.
