# Google SSO for Postman and React Native

Same pattern as Parents portal (`kreativa_public_portal` → `POST /api/mobile/auth/google`).

Learn is **student role** only. No email/password.

```
Google Sign-In (student account)
        ↓
  idToken  or  accessToken
        ↓
POST /api/auth/login   (alias: POST /api/mobile/auth/google)
        ↓
{ tokenType, accessToken, expiresIn, studentId, user }
        ↓
Authorization: Bearer <accessToken>
```

---

## Request

`POST {{baseUrl}}/api/auth/login`  
or `POST {{baseUrl}}/api/mobile/auth/google`

Headers: `Content-Type: application/json`

Either body:

```json
{ "idToken": "<Google ID token>" }
```

```json
{ "accessToken": "<Google access token>" }
```

`accessToken` is easier in Postman: **Get New Access Token** already gives you one.

The student **email is inside the Google token**. Do not send email or password.

---

## Success (200)

```json
{
  "tokenType": "Bearer",
  "accessToken": "<LMS JWT>",
  "token": "<same JWT, alias>",
  "expiresIn": 2592000,
  "studentId": 2602,
  "userId": 2602,
  "schoolId": 6,
  "user": {
    "userId": 2602,
    "studentId": 2602,
    "schoolId": 6,
    "email": "student@school.id",
    "fullName": "...",
    "role": "student"
  }
}
```

Use `accessToken` as `Authorization: Bearer ...` on all other student APIs.

---

## Option A — Postman OAuth 2.0 (recommended)

In [Google Cloud Console](https://console.cloud.google.com/) use the **same** OAuth client as Learn (`GOOGLE_CLIENT_ID`). Add redirect:

`https://oauth.pstmn.io/v1/callback`

Postman → Authorization → OAuth 2.0 → Get New Access Token:

| Field | Value |
|---|---|
| Grant type | Authorization Code |
| Auth URL | `https://accounts.google.com/o/oauth2/v2/auth` |
| Access Token URL | `https://oauth2.googleapis.com/token` |
| Client ID / Secret | Learn `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` |
| Scope | `openid email profile` |
| Callback URL | `https://oauth.pstmn.io/v1/callback` |

Sign in as the **student** Google account.

- Easiest: copy the **Access Token** into `{{googleAccessToken}}` and run **Login with Google accessToken**.
- Or copy **`id_token`** into `{{idToken}}` and run **Login with Google idToken**.

For native apps, also allow these audiences (same as portal): `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_MOBILE_CLIENT_IDS` (comma-separated).

---

## Option B — OAuth Playground

[https://developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)  
Gear → **Use your own OAuth credentials** (Learn client). Authorize → copy `access_token` or `id_token`.

---

## Errors

| Status | Body |
|---|---|
| 400 | `{ "error": "idToken or accessToken is required" }` |
| 401 | `{ "error": "Invalid Google token" }` |
| 403 | `{ "error": "Account not registered", "code": "ACCOUNT_NOT_REGISTERED" }` |
| 403 | `{ "error": "This API is for student accounts only" }` |

---

## React Native

Same as Parents app: Google Sign-In SDK → send `idToken` (or `accessToken`) to this login endpoint. Use the returned `accessToken` as Bearer.
