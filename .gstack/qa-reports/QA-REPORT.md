# QA Report — Blog Platform v1

**Date:** 2026-05-12
**Branch:** main
**Tier:** Standard (curl-based — browse tool unavailable)
**Dev server:** `localhost:3000`

## Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Public APIs | 10 | 10 | 0 |
| Page Rendering + SEO | 7 | 7 | 0 |
| Auth Flow (Register/Login/Session) | 9 | 9 | 0 |
| Authenticated APIs (CRUD) | 6 | 6 | 0 |
| Security Boundaries | 6 | 6 | 0 |
| **Total** | **38** | **38** | **0** |

## Bugs Found & Fixed

### P2 — Register API returns 200 instead of 201
- **File:** `src/app/api/auth/register/route.ts:46`
- **Fix:** `NextResponse.json({ success: true }, { status: 201 })`
- **Commit:** `531eb74`

## Test Details

### Public API Endpoints
- ✅ `GET /api/discover` → 200
- ✅ `GET /api/discover?page=2` → 200
- ✅ `GET /api/profile/mzl` → 200
- ✅ `GET /api/profile/lmd` → 200
- ✅ `GET /api/profile/nobody` → 404 "用户不存在"
- ✅ `GET /api/posts?username=mzl` → 200
- ✅ `GET /api/posts` (no username) → 400
- ✅ `GET /api/posts/[id]` → 200
- ✅ `GET /api/posts/nonexistent` → 404 "文章不存在"
- ✅ `GET /api/posts/[id]/comments` → 200
- ✅ `GET /mzl/rss.xml` → 200 (RSS XML)

### Page Rendering
- ✅ `/` — html lang="zh-CN", title "发现博客 | Blog Platform", meta description
- ✅ `/register` — form with 用户名, 邮箱, 密码
- ✅ `/login` — form with 登录, 邮箱, 密码
- ✅ `/login?registered=true` — "注册成功" banner
- ✅ `/mzl` — blog page renders
- ✅ `/lmd` — blog page renders
- ✅ `/noSuchUser` → 404

### Auth Flow
- ✅ Register with valid data → 201
- ✅ Duplicate username → 409 "用户名已存在"
- ✅ Duplicate email → 409 "邮箱已注册"
- ✅ Username too short (<3) → 400
- ✅ Username invalid chars → 400
- ✅ Reserved word → 400 "系统保留字"
- ✅ Invalid email → 400
- ✅ Password too short → 400
- ✅ Login + session cookie obtained

### Authenticated Operations
- ✅ `GET /api/my-posts` → 200
- ✅ `PUT /api/profile` (sitePublished toggle) → 200
- ✅ `POST /api/posts` (create post) → 201
- ✅ `PUT /api/posts/[id]` (update) → 200
- ✅ `DELETE /api/posts/[id]` → 200

### Security Boundaries
- ✅ `POST /api/posts` without auth → 401
- ✅ `PUT /api/profile` without auth → 401
- ✅ `DELETE /api/posts/x` without auth → 401
- ✅ `POST /api/posts/x/comments` without auth → allowed (public)
- ✅ Comment validation (empty fields → 400)
- ✅ XSS: avatar URL http blocked by validation

## Known Limitations (not bugs)

- `GET /api/profile` returns 405 — no GET handler for generic profile (by design: use `GET /api/profile/[username]`)
- `POST /api/upload` requires auth + file — 401/400 respectively (correct behavior)
- Dev server cannot persist across tool sessions (shell timeout kills background processes)

## Untested (requires browser)

The following features require a real browser and could not be tested:

- Toast notifications (visual)
- Modal open/close + ESC + backdrop click
- Form loading states + spinner
- Comment section rendering + submit inline
- Markdown preview rendering
- Responsive layout breakpoints
- Site publish toggle UI feedback
- Button disabled states + active scale animation
