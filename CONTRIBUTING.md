# Contributing to EthioTech Platform

Thank you for your interest in contributing to the **EthioTech Platform**! We are building a nationwide, open-impact educational operating system to empower Ethiopian youth with modern software engineering skills and live diaspora mentorship.

---

## 🧭 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone, regardless of experience level, nationality, language, or background. Please treat all contributors and community members with respect and empathy.

---

## 🛠️ Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork locally**:
   ```bash
   git clone https://github.com/<your-username>/ethio-tech-platform.git
   cd ethio-tech-platform
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Setup environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
5. **Seed the development database**:
   ```bash
   npm run seed
   ```
6. **Start development servers**:
   ```bash
   npm run dev
   ```

---

## 🌿 Branching & Commit Conventions

- Use feature branches branched from `main`:
  - `feat/<feature-name>` (e.g., `feat/hub-qr-scanner`)
  - `fix/<bug-description>` (e.g., `fix/webrtc-hand-raise-queue`)
  - `docs/<topic>` (e.g., `docs/api-contracts`)
  - `refactor/<scope>` (e.g., `refactor/cms-markdown-studio`)
- Use [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat(classroom): add livekit screen-share recording toggle`
  - `fix(auth): enforce refresh token cookie sameSite strict`
  - `docs(readme): add regional hub mesh architecture diagrams`

---

## 🧪 Testing & Quality Gate

Before submitting any Pull Request, ensure all quality verification gates pass locally:

```bash
# 1. Full Typecheck across both workspaces
npm run typecheck

# 2. Frontend Test Suite (19 test files, 117+ tests)
npm test -w frontend

# 3. Backend Test Suite (31 test files, 117+ tests)
npm test -w backend

# 4. Production Build Verification
npm run build
```

---

## 🚀 Submitting a Pull Request

1. Push your branch to your GitHub fork:
   ```bash
   git push origin feat/your-feature
   ```
2. Open a Pull Request against the `main` branch of `Bedru-Mekiyu/ethio-tech-platform`.
3. Provide a clear description of the problem solved, code changes made, and steps to verify.
4. Attach screenshots or terminal outputs where applicable.
