# Scripts

One-off maintenance scripts. Not deployed to Vercel.

## migrate-photos.js

Re-hosts every Google Places photo (`lh3.googleusercontent.com/...`) referenced by `places.image_url` and `places.photos[]` into our Supabase Storage bucket, then updates the row.

**Why:** Google photos can't be served through our `/storage/v1/render/image` transform endpoint (so they bypass resizing/WebP) and they set the `COMPASS` third-party cookie that hurts Lighthouse Best Practices.

### One-time setup

1. **Get the service role key.** In Supabase Dashboard → Project Settings → API → "service_role" secret. **Do not commit this key.**
2. **Export it for the current shell:**
   ```bash
   export SUPABASE_SERVICE_KEY='eyJ...your-service-role-key...'
   ```

### Run the migration

Always start with a dry-run on a tiny subset.

```bash
# 1. See what would happen for 2 places (no writes)
node scripts/migrate-photos.js --limit 2

# 2. Apply for 2 places to verify end-to-end
node scripts/migrate-photos.js --limit 2 --apply

# 3. Inspect the 2 affected places in the app — confirm photos still load,
#    detail modal works, hero looks right.

# 4. If happy, run the rest. The script skips places already migrated.
node scripts/migrate-photos.js --apply
```

The script processes places sequentially, photos within a place sequentially, retries each photo twice on failure, and logs per-place progress. It can be killed and restarted at any time — `scripts/.migrate-state.json` tracks which place IDs are done.

### Estimated cost / time

- ~207 places × ~5 photos = ~1000 photos to migrate
- ~500 KiB per photo → ~500 MB of storage (free tier is 1 GiB)
- ~2-5s per photo end-to-end → 30-90 minutes total
