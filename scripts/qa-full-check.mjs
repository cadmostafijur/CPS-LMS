#!/usr/bin/env node
/**
 * Full local QA — login as each demo role and verify pages + APIs.
 * Run: node scripts/qa-full-check.mjs
 */

const FRONTEND = process.env.QA_FRONTEND_URL || "http://localhost:3000";
const BACKEND = process.env.QA_BACKEND_URL || "http://127.0.0.1:1337/api";

const ACCOUNTS = [
  { role: "Admin", email: "admin@lms-demo.com", password: "DemoAdmin123!" },
  { role: "Content Manager", email: "content@lms-demo.com", password: "DemoContent123!" },
  { role: "Instructor", email: "instructor@lms-demo.com", password: "DemoInstructor123!" },
  { role: "Student", email: "student@lms-demo.com", password: "DemoStudent123!" },
];

const PAGES_BY_ROLE = {
  Admin: [
    "/admin/dashboard",
    "/admin/users",
    "/admin/students",
    "/admin/instructors",
    "/admin/courses",
    "/admin/categories",
    "/admin/batches",
    "/admin/attendance",
    "/admin/enrollments",
    "/admin/assignments",
    "/admin/question-bank",
    "/admin/certificates",
    "/admin/orders",
    "/admin/payments",
    "/admin/coupons",
    "/admin/plans",
    "/admin/subscriptions",
    "/admin/inventory",
    "/admin/banners",
    "/admin/announcements",
    "/admin/blog",
    "/admin/notifications",
    "/admin/reviews",
    "/admin/tickets",
    "/admin/audit-logs",
    "/admin/settings",
    "/admin/reports",
    "/profile",
  ],
  "Content Manager": [
    "/content-manager/dashboard",
    "/content-manager/courses",
    "/content-manager/courses/new",
    "/content-manager/progress",
    "/content-manager/categories",
    "/content-manager/blog",
    "/content-manager/banners",
    "/profile",
  ],
  Instructor: [
    "/instructor/dashboard",
    "/instructor/courses",
    "/instructor/courses/new",
    "/instructor/progress",
    "/instructor/assignments",
    "/instructor/messages",
    "/profile",
  ],
  Student: [
    "/student/dashboard",
    "/student/analytics",
    "/student/my-courses",
    "/student/assignments",
    "/student/certificates",
    "/student/wishlist",
    "/student/calendar",
    "/student/messages",
    "/student/assistant",
    "/student/transcript",
    "/profile",
  ],
};

const PUBLIC_PAGES = ["/", "/login", "/register", "/courses", "/blog", "/about", "/privacy"];

const results = [];

function record(category, name, ok, detail = "") {
  results.push({ category, name, ok, detail });
  const icon = ok ? "PASS" : "FAIL";
  const line = detail ? ` — ${detail}` : "";
  console.log(`[${icon}] ${category} / ${name}${line}`);
}

async function loginFrontend(email, password) {
  const res = await fetch(`${FRONTEND}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, password }),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  if (!res.ok) {
    return { ok: false, cookies: "", body, status: res.status };
  }
  const setCookies = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : [];
  const cookies = setCookies.map((c) => c.split(";")[0]).join("; ");
  return { ok: true, cookies, body, jwt: body.jwt, user: body.user };
}

async function loginBackend(email, password) {
  const res = await fetch(`${BACKEND}/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, password }),
  });
  const body = await res.json();
  return { ok: res.ok, jwt: body.jwt, user: body.user, body, status: res.status };
}

async function getPage(path, cookies) {
  const res = await fetch(`${FRONTEND}${path}`, {
    headers: cookies ? { Cookie: cookies } : {},
    redirect: "manual",
  });
  const loc = res.headers.get("location") || "";
  if (res.status >= 300 && res.status < 400 && loc.includes("/login")) {
    return { ok: false, status: res.status, detail: "redirected to login" };
  }
  if (res.status >= 500) {
    const text = await res.text();
    return { ok: false, status: res.status, detail: text.slice(0, 120) };
  }
  if (res.status === 404) {
    return { ok: false, status: 404, detail: "404" };
  }
  // 200 or redirect to dashboard (role mismatch) — follow once
  if (res.status >= 300 && res.status < 400) {
    const res2 = await fetch(`${FRONTEND}${loc}`, {
      headers: cookies ? { Cookie: cookies } : {},
    });
    const text = await res2.text();
    const hasError = /Something went wrong|Application error/i.test(text);
    return {
      ok: res2.ok && !hasError,
      status: res2.status,
      detail: hasError ? "error page" : loc !== path ? `via ${loc}` : "",
    };
  }
  const text = await res.text();
  const hasError = /Something went wrong|Application error|Internal Server Error/i.test(text);
  return {
    ok: res.ok && !hasError,
    status: res.status,
    detail: hasError ? "error in HTML" : "",
  };
}

async function apiGet(path, token) {
  const res = await fetch(`${BACKEND}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let body;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, body };
}

async function apiPost(path, token, payload) {
  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  let body;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, body };
}

async function bffPost(path, cookies, payload) {
  const res = await fetch(`${FRONTEND}${path}`, {
    method: "POST",
    headers: {
      Cookie: cookies,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  let body;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  console.log("\n=== CPS Academy LMS — Full QA Check ===\n");
  console.log(`Frontend: ${FRONTEND}`);
  console.log(`Backend:  ${BACKEND}\n`);

  // Health
  try {
    const fe = await fetch(FRONTEND);
    record("Health", "Frontend reachable", fe.ok || fe.status < 500, `status ${fe.status}`);
  } catch (e) {
    record("Health", "Frontend reachable", false, e.message);
    console.log("\nStart frontend: cd frontend && npm run dev\n");
    process.exit(1);
  }

  try {
    const be = await fetch(`${BACKEND}/lms/catalog`);
    record("Health", "Backend reachable", be.ok, `status ${be.status}`);
  } catch (e) {
    record("Health", "Backend reachable", false, e.message);
    console.log("\nStart backend: cd backend && npm run develop\n");
    process.exit(1);
  }

  // Public pages
  for (const path of PUBLIC_PAGES) {
    const r = await getPage(path, "");
    record("Public", path, r.ok, r.detail || `HTTP ${r.status}`);
  }

  const sessions = {};

  for (const account of ACCOUNTS) {
    const feLogin = await loginFrontend(account.email, account.password);
    record(
      "Login",
      `${account.role} (frontend)`,
      feLogin.ok,
      feLogin.ok ? feLogin.user?.role?.name || feLogin.user?.email : JSON.stringify(feLogin.body?.error || feLogin.body).slice(0, 80)
    );

    const beLogin = await loginBackend(account.email, account.password);
    record(
      "Login",
      `${account.role} (backend JWT)`,
      beLogin.ok,
      beLogin.ok ? "" : String(beLogin.body?.error?.message || beLogin.status)
    );

    if (!feLogin.ok || !beLogin.ok) continue;

    sessions[account.role] = {
      cookies: feLogin.cookies,
      jwt: beLogin.jwt,
      user: beLogin.user,
    };

    const pages = PAGES_BY_ROLE[account.role] || [];
    for (const path of pages) {
      const r = await getPage(path, feLogin.cookies);
      record(`${account.role} Page`, path, r.ok, r.detail || `HTTP ${r.status}`);
    }
  }

  // --- Functional tests ---
  const student = sessions.Student;
  const instructor = sessions.Instructor;
  const cm = sessions["Content Manager"];
  const admin = sessions.Admin;

  if (student?.jwt) {
    const dash = await apiGet("/lms/dashboard/student", student.jwt);
    record("Student API", "Dashboard", dash.ok, dash.ok ? "" : String(dash.status));

    const courses = await apiGet("/lms/my-courses", student.jwt);
    record(
      "Student API",
      "My courses",
      courses.ok && Array.isArray(courses.body?.data),
      courses.ok ? `${courses.body.data?.length || 0} enrollments` : String(courses.status)
    );

    const analytics = await apiGet("/lms/student/analytics", student.jwt);
    record("Student API", "Analytics", analytics.ok, analytics.ok ? "" : String(analytics.status));

    const catalog = await apiGet("/lms/catalog", student.jwt);
    record(
      "Student API",
      "Catalog",
      catalog.ok && Array.isArray(catalog.body?.data),
      catalog.ok ? `${catalog.body.data?.length || 0} courses` : String(catalog.status)
    );

    if (student.cookies) {
      const sage = await bffPost(
        "/api/ai/assistant",
        student.cookies,
        {
          messages: [{ role: "user", content: "What is a binary tree? Answer in one sentence." }],
          context: { enrolledCourses: ["Competitive Programming Basics"] },
        }
      );
      const reply = sage.body?.data?.content || "";
      const isTemplate = /Try breaking it into/i.test(reply);
      record(
        "Student API",
        "Sage AI assistant",
        sage.ok && reply.length > 20 && !isTemplate,
        sage.ok
          ? isTemplate
            ? "template fallback (not real AI)"
            : `provider=${sage.body?.data?.provider || "?"} len=${reply.length}`
          : String(sage.body?.error || sage.status)
      );
    }
  }

  if (instructor?.jwt) {
    const dash = await apiGet("/lms/dashboard/instructor", instructor.jwt);
    record(
      "Instructor API",
      "Dashboard",
      dash.ok && dash.body?.data?.courses,
      dash.ok ? `${dash.body.data.courses?.length || 0} courses` : String(dash.status)
    );

    const staffCourses = await apiGet("/lms/staff/courses", instructor.jwt);
    record(
      "Instructor API",
      "Staff courses list",
      staffCourses.ok && Array.isArray(staffCourses.body?.data),
      staffCourses.ok ? `${staffCourses.body.data?.length || 0} courses` : String(staffCourses.status)
    );

    const courseId = staffCourses.body?.data?.[0]?.documentId || staffCourses.body?.data?.[0]?.id;
    if (courseId) {
      const mod = await apiPost(`/lms/courses/${courseId}/modules`, instructor.jwt, {
        title: `QA Module ${Date.now()}`,
        description: "Automated test",
        order: 99,
      });
      record(
        "Instructor API",
        "Create module",
        mod.ok && mod.body?.data?.title,
        mod.ok ? mod.body.data.title : String(mod.body?.error?.message || mod.status)
      );
      if (mod.ok && mod.body?.data) {
        const modId = mod.body.data.documentId || mod.body.data.id;
        const del = await fetch(`${BACKEND}/lms/modules/${modId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${instructor.jwt}` },
        });
        record("Instructor API", "Delete module (cleanup)", del.ok, `HTTP ${del.status}`);
      }
    }
  }

  if (cm?.jwt) {
    const dash = await apiGet("/lms/dashboard/content-manager", cm.jwt);
    record("CM API", "Dashboard", dash.ok, dash.ok ? `${dash.body?.data?.courses || 0} total courses` : String(dash.status));

    const staffCourses = await apiGet("/lms/staff/courses", cm.jwt);
    record(
      "CM API",
      "Staff courses list",
      staffCourses.ok && Array.isArray(staffCourses.body?.data),
      staffCourses.ok ? `${staffCourses.body.data?.length || 0} courses` : String(staffCourses.status)
    );

    const created = await apiPost("/lms/courses", cm.jwt, {
      title: `QA Course ${Date.now()}`,
      shortDescription: "Automated QA test course",
      status: "DRAFT",
      isFree: true,
    });
    record(
      "CM API",
      "Create course",
      created.ok && created.body?.data?.id,
      created.ok
        ? `id=${created.body.data.documentId || created.body.data.id}`
        : String(created.body?.error?.message || created.status)
    );

    if (created.ok) {
      const cid = created.body.data.documentId || created.body.data.id;
      const editPage = await getPage(`/content-manager/courses/${cid}/edit`, cm.cookies);
      record("CM API", "Edit course page after create", editPage.ok, editPage.detail || `HTTP ${editPage.status}`);

      const del = await fetch(`${BACKEND}/lms/courses/${cid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${cm.jwt}` },
      });
      record("CM API", "Delete course (cleanup)", del.ok, `HTTP ${del.status}`);
    }
  }

  if (admin?.jwt) {
    const dash = await apiGet("/lms/dashboard/admin", admin.jwt);
    record("Admin API", "Dashboard", dash.ok, dash.ok ? "" : String(dash.status));

    const users = await apiGet("/lms/admin/users", admin.jwt);
    record(
      "Admin API",
      "Users list",
      users.ok && Array.isArray(users.body?.data),
      users.ok ? `${users.body.data?.length || 0} users` : String(users.status)
    );
  }

  // Summary
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log("\n=== SUMMARY ===");
  console.log(`Total: ${results.length}  Passed: ${passed}  Failed: ${failed.length}`);

  if (failed.length) {
    console.log("\n--- FAILURES ---");
    for (const f of failed) {
      console.log(`  [${f.category}] ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
    }
  }

  console.log("\n--- VIDEO DEMO ORDER (recommended) ---");
  console.log("1. Public: / → /courses → open a course → /blog");
  console.log("2. Student: login → dashboard → my-courses → lesson → quiz → Sage");
  console.log("3. Instructor: login → courses → edit → modules/lessons/quizzes");
  console.log("4. Content Manager: login → courses → create → publish");
  console.log("5. Admin: login → users → enrollments → reports\n");

  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
