# Real LMS features — status

## Shipable in this repo (feature/real-lms-full-wave)

| Area | Status |
|------|--------|
| Student–instructor messaging | Done |
| Assignment file upload (server `public/uploads`) | Done |
| Email notifications | Done when `SMTP_*` env set; always in-app |
| Live calendar + attendance mark | Done |
| Wishlist reminders | Done |
| Transcript + instructor grades CSV | Done |
| Timed quiz auto-submit | Done |
| Course clone + SEO/tags | Done |
| Lesson captions URL + content version snapshot | Done |
| Richer instructor analytics (drop-off / difficulty) | Done |

## Needs external vendors / months of product (not “one session”)

Stripe/bKash + invoices/refunds, real Zoom SDK, SCORM/H5P, plagiarism, native mobile/offline, SSO/SAML, multi-tenant, LTI, Sentry BI suite, full CDN media library, social OAuth apps, proctored lockdown exams.

Configure SMTP in `backend/.env` to turn on email. Merge `feature/course-discussions`, `feature/real-lms-extensions`, then this branch into `main` and restart Strapi.
