import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "CPS Academy privacy policy.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How CPS Academy collects, uses, and protects your information."
    >
      <p>
        CPS Academy respects your privacy. We collect account information (name,
        email) and learning activity (enrollments, quiz attempts, progress) to
        operate the platform and improve your experience.
      </p>
      <h2>Data we collect</h2>
      <p>
        Registration details, course interactions, support messages, and optional
        newsletter sign-ups when you provide them.
      </p>
      <h2>How we use data</h2>
      <p>
        To authenticate you, deliver courses, send service-related notifications,
        and respond to support requests. We do not sell your personal data.
      </p>
      <h2>Contact</h2>
      <p>
        For privacy questions, email{" "}
        <a href="mailto:support@cpsacademy.io" className="text-orange hover:underline">
          support@cpsacademy.io
        </a>
        .
      </p>
    </LegalPage>
  );
}
