Hair Spa Manager update manifest lives in this folder.

Files expected by the updater:
- version.json
- SalonManagerSetup-<version>.exe
- release-notes-<version>.txt

The desktop app can either read this manifest through:
- /app-updates/hair-spa-manager/version.json
- /api/v1/app-updates/hair-spa-manager/manifest

The API route is preferred when update entitlement by key needs to be enforced later.