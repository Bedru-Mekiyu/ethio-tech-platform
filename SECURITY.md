# Security Policy & Data Safety

The EthioTech engineering team takes the security and privacy of our students, mentors, and partner organizations seriously.

---

## 🛡️ Supported Versions

| Version | Supported |
|---|---|
| 2.x (Current) | ✅ Fully supported with active security patches |
| 1.x (Legacy) | ⚠️ Security patches only |

---

## 🚨 Reporting a Vulnerability

If you discover a potential security vulnerability within the EthioTech Platform, please **DO NOT** open a public GitHub issue.

Instead, please report it directly to our security engineering team:
- **Email**: `security@ethio-tech.org` or `hello@ethiotech.com`
- **Subject Line**: `[SECURITY VULNERABILITY] - <Short Summary>`

Please include in your report:
1. Type of issue (e.g., Broken Access Control, Authentication Bypass, XSS, SSRF, SQL/NoSQL Injection).
2. Step-by-step instructions or Proof-of-Concept to reproduce the vulnerability.
3. Affected endpoints, parameters, or UI components.
4. Potential impact on user data or system integrity.

We will acknowledge receipt of your vulnerability report within **48 hours** and provide regular status updates until the patch is deployed.

---

## 🔒 Platform Security Controls

1. **Authentication & JWT Security**:
   - Access tokens have short TTLs (15m–24h) and are signed using high-entropy secrets (`JWT_SECRET`).
   - Refresh tokens are stored in secure, `HttpOnly`, `SameSite=Strict` cookies.
   - User status is validated on every authenticated request (checking for account suspensions or bans).

2. **Role-Based Access Control (RBAC)**:
   - Strict 7-tier role hierarchy defined in `backend/src/config/permissions.js` (Super Admin, Admin, Moderator, Reviewer, Support, Mentor, Student/Parent).
   - Route-level middleware ensures least-privilege enforcement.

3. **Input Sanitization & Injection Defense**:
   - All REST requests validated through strict **Zod schemas**.
   - Mongoose schemas enforce strong typing and prevent query selector injection.

4. **Rate Limiting & Anti-Abuse**:
   - Global API limit: `100 requests per 15 minutes` per IP.
   - Authentication limit: `5 login attempts per 15 minutes` per IP.
   - Live session and meeting actions rate limited against spamming.
