/** Bust Next.js RSC cache for staff course list pages after mutations. */
export async function revalidateStaffCoursePaths(redirectBase: string) {
  const paths = [redirectBase];
  if (redirectBase.includes("/content-manager")) {
    paths.push("/content-manager/dashboard");
  } else if (redirectBase.includes("/instructor")) {
    paths.push("/instructor/dashboard");
  }
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    });
  } catch {
    // Non-fatal — router.refresh() still updates the current page
  }
}
