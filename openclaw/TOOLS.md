# Tools

## Supabase — HTTP

Use the `http` tool for all database operations. The tool name may differ on your OpenClaw version — check `openclaw tools list` if it doesn't trigger. Common alternatives: `fetch`, `http_request`, `web_request`.

### Required headers (every request)

| Header | Value |
|---|---|
| `apikey` | value of `SUPABASE_SERVICE_ROLE_KEY` env var |
| `Authorization` | `Bearer <SUPABASE_SERVICE_ROLE_KEY>` |
| `Content-Type` | `application/json` |

Replace `<SUPABASE_URL>` and `<BOT_USER_ID>` with the values of their respective environment variables.

---

### Read cellar

```
GET <SUPABASE_URL>/rest/v1/wines?user_id=eq.<BOT_USER_ID>&inventory=gt.0&select=id,name,winery,vintage,type,style,country,region,sub_region,price,inventory,drink_from,drink_by&order=name.asc
```

---

### Add wine

```
POST <SUPABASE_URL>/rest/v1/wines
Prefer: return=representation
```

Body (JSON):
```json
{
  "user_id": "<BOT_USER_ID>",
  "name": "...",
  "winery": "...",
  "vintage": "YYYY or NV",
  "type": "Red | White | Sparkling | Rosé | Dessert | Fortified",
  "style": "varietal or blend, e.g. Pinot Noir",
  "country": "...",
  "region": "...",
  "sub_region": null,
  "price": null,
  "inventory": 1,
  "drink_from": null,
  "drink_by": null,
  "source": "telegram"
}
```

---

### Decrement inventory

```
PATCH <SUPABASE_URL>/rest/v1/wines?id=eq.<wine_id>&user_id=eq.<BOT_USER_ID>
Prefer: return=representation
```

Body (JSON):
```json
{ "inventory": <current_value_minus_1> }
```

Read the current inventory from the cellar first, then send `inventory - 1`. Minimum value is 0.
