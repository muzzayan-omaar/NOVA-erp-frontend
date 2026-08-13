import { AlertTriangle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow p-8">
        <div className="bg-amber-50 text-amber-700 text-sm font-medium rounded-2xl px-4 py-3 mb-8 flex items-center gap-2">
          <AlertTriangle size={18} />
          Draft — this document has not yet completed legal review and is subject to change.
        </div>

        <h1 className="text-2xl font-bold mb-2">Nova ERP — Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: [DATE]</p>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-4">
          <p>
            These Terms of Service govern access to and use of the Nova ERP platform,
            operated by <strong>[Company Legal Name]</strong>.
          </p>

          <h2 className="text-lg font-bold mt-6">1. What Nova ERP Is</h2>
          <p>
            Nova ERP is a point-of-sale, inventory, and business-management platform for
            small and medium businesses in Uganda. Nova ERP does not currently provide
            certified EFRIS integration with the Uganda Revenue Authority. You remain
            solely responsible for your own tax compliance.
          </p>

          <h2 className="text-lg font-bold mt-6">2. Account Setup</h2>
          <p>
            Accounts are created either through self-registration or by a Nova
            representative during onboarding. You are responsible for keeping your
            Business Code and login credentials confidential.
          </p>

          <h2 className="text-lg font-bold mt-6">3. Subscription & Payment</h2>
          <p>
            Nova ERP is offered in fixed Packages with optional add-on Bundles, billed
            monthly, quarterly, or annually. Payments are currently verified manually by
            Nova staff. Pricing is fixed and published — Nova does not offer individually
            negotiated discounts outside of published Packages.
          </p>

          <h2 className="text-lg font-bold mt-6">4. Suspension & Termination</h2>
          <p>
            Nova may suspend an account for non-payment or breach of these Terms. You may
            request cancellation at any time; data is retained after suspension or
            cancellation as described in the Privacy Policy.
          </p>

          <h2 className="text-lg font-bold mt-6">5. Support Access</h2>
          <p>
            Nova support staff may, when providing support you've requested, access a
            logged, audited support session mirroring your account. This access is never
            silent and is always recorded.
          </p>

          <h2 className="text-lg font-bold mt-6">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by Ugandan law, Nova's liability is limited as
            set out in the full Terms document maintained internally pending legal
            finalization.
          </p>

          <h2 className="text-lg font-bold mt-6">7. Governing Law</h2>
          <p>These Terms are governed by the laws of the Republic of Uganda.</p>

          <p className="pt-4 text-slate-400 text-xs">
            The complete draft terms are available on request while this page is finalized.
          </p>
        </div>
      </div>
    </div>
  );
}