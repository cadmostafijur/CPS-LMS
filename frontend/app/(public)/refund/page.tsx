import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "CPS Academy refund policy.",
};

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      description="Terms for refunds on paid courses at CPS Academy."
    >
      <p>
        We want you to be satisfied with your learning experience. Refund requests
        are reviewed on a case-by-case basis according to the policy below.
      </p>
      <h2>Eligibility</h2>
      <p>
        Paid course refunds may be requested within 7 days of purchase if you have
        completed less than 20% of the course content. Free courses and
        promotional enrollments are not eligible for refunds.
      </p>
      <h2>How to request</h2>
      <p>
        Email{" "}
        <a href="mailto:support@cpsacademy.io" className="text-orange hover:underline">
          support@cpsacademy.io
        </a>{" "}
        with your account email, course name, and reason for the request. Approved
        refunds are processed to the original payment method within 7–14 business
        days.
      </p>
    </LegalPage>
  );
}
