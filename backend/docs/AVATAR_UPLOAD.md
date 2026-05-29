# Avatar upload configuration

## Primary path (recommended): Cloudinary direct upload

1. Create a [Cloudinary](https://cloudinary.com) account.
2. Copy credentials into `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. Restart the backend.
4. Smoke test (while logged in):

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" http://localhost:5000/api/v1/users/me/avatar/sign
```

Expected: `200` with `signature`, `timestamp`, `apiKey`, `cloudName`, `folder`.

If vars are missing: `500` with `"Upload service not configured"`.

## Fallback path: server multipart upload

When Cloudinary is not configured, the frontend can use `POST /api/v1/users/me/avatar` with `multipart/form-data` field `avatar` (max 2 MB). The server uploads to Cloudinary when configured, or returns an error if not.

## Rate limits

- Signature endpoint: 1 request per 5 seconds per user.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 500 on `/me/avatar/sign` | Set all three `CLOUDINARY_*` env vars |
| Upload succeeds but avatar missing after refresh | Ensure `serializeAuthUser` includes `avatar` (fixed in profile polish) |
| 429 on sign | Wait 5 seconds between attempts |
