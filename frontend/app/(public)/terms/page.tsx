import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "CPS Academy terms and conditions.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      description="Rules for using the CPS Academy learning platform."
    >
      <p>
        By creating an account or using CPS Academy, you agree to these terms.
        Please read them carefully before enrolling in courses.
      </p>
      <h2>Accounts</h2>
      <p>
        You are responsible for keeping your login credentials secure and for all
        activity under your account.
      </p>
      <h2>Course access</h2>
      <p>
        Course materials are for personal learning only. Sharing accounts,
        redistributing content, or attempting to circumvent access controls is
        not permitted.
      </p>
      <h2>Payments</h2>
      <p>
        Paid enrollments are subject to our Refund Policy. Prices and offers may
        change; your purchase is governed by the terms shown at checkout.
      </p>
      <h2>Support</h2>
      <p>
        Questions about these terms? Contact{" "}
        <a href="mailto:support@cpsacademy.io" className="text-orange hover:underline">
          support@cpsacademy.io
        </a>{" "}
        or call (+88) 01759261490.
      </p>
    </LegalPage>
  );
}
