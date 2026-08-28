import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site-nav";

export const metadata: Metadata = {
  title: "About us",
  description: "Learn about CPS Academy and our mission to train competitive programmers.",
};

export default function AboutPage() {
  return (
    <LegalPage
      title="About CPS Academy"
      description={`${SITE_NAME} — ${SITE_TAGLINE}`}
    >
      <p>
        CPS Academy is a coding academy based in Chittagong, Bangladesh. We teach
        competitive programming and help students build stronger problem-solving
        skills for software engineering careers.
      </p>
      <p>
        Through structured courses, quizzes, progress tracking, and Sage — our AI
        learning assistant — learners move from fundamentals to contest-ready
        skills at their own pace.
      </p>
      <h2>Our mission</h2>
      <p>
        Make competitive programming education accessible, practical, and aligned
        with what top-tier programmers practice every day.
      </p>
    </LegalPage>
  );
}
