# Zemen backend API

Pulled from [kena741/zemen_backend](https://github.com/kena741/zemen_backend) live Cloud Run services.

| Env | Base URL | OpenAPI | Docs |
|-----|----------|---------|------|
| Staging | https://zemen-service-backend-staging-558278833956.europe-west4.run.app | [openapi-staging.json](./openapi-staging.json) | [/docs](https://zemen-service-backend-staging-558278833956.europe-west4.run.app/docs) |
| Production | https://zemen-service-backend-prod-558278833956.europe-west4.run.app | [openapi-prod.json](./openapi-prod.json) | [/docs](https://zemen-service-backend-prod-558278833956.europe-west4.run.app/docs) |

- Health: `GET /api/v1/health`
- Prefix: `/api/v1/...`
- Supabase inventory (shared DB): [schema_inventory.json](./schema_inventory.json) (`project_ref=rffptyqhqvzrpmyxlwwu`)

Refresh:

```bash
curl -sS "$API_BASE/openapi.json" -o docs/api/openapi-staging.json
```

## Production frontend flip gate

Do **not** set `NEXT_PUBLIC_DATA_MODE=backend` on production until prod OpenAPI includes:

- `/api/v1/auth/login`
- `/api/v1/auth/session/restore`
- `/api/v1/storage/upload`

Check locally / in Cloud Build:

```bash
npm run check:prod-backend-gate
```

Staging may ship backend mode while prod backend catches up. Never point production frontend at the staging API.
