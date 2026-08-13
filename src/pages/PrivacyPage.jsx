import { AlertTriangle } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow p-8">
        <div className="bg-amber-50 text-amber-700 text-sm font-medium rounded-2xl px-4 py-3 mb-8 flex items-center gap-2">
          <AlertTriangle size={18} />
          Draft — this document has not yet completed legal review and is subject to change.
        </div>

        <h1 className="text-2xl font-bold mb-2">Nova ERP — Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: [DATE]</p>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-4">
          <p>
            This Privacy Policy explains how <strong>[Company Legal Name]</strong>
            collects, uses, and protects personal data through Nova ERP.
          </p>

          <h2 className="text-lg font-bold mt-6">1. What We Collect</h2>
          <p>
            Business and account information you provide at onboarding; operational data
            entered by you and your staff (products, sales, customers, suppliers,
            payroll); technical data such as login timestamps and audit logs; and any
            messages you send through in-app Support.
          </p>

          <h2 className="text-lg font-bold mt-6">2. How We Use It</h2>
          <p>
            To provide the Service, verify payments, detect fraud and stock discrepancies,
            respond to support requests, and send operational notifications. We do not
            sell personal data and do not use your business data for advertising.
          </p>

          <h2 className="text-lg font-bold mt-6">3. Who Can See Your Data</h2>
          <p>
            Your own staff, according to role-based permissions you control; and Nova
            platform staff, only when verifying a payment or providing support you've
            requested — every such access is logged. Your data is never shared with other
            businesses using Nova ERP.
          </p>

          <h2 className="text-lg font-bold mt-6">4. Data Security</h2>
          <p>
            Passwords are never stored in plain text, access is role-restricted, login
            attempts are rate-limited, and platform staff use a fully separate
            authentication system from client accounts.
          </p>

          <h2 className="text-lg font-bold mt-6">5. Your Rights</h2>
          <p>
            Subject to Uganda's Data Protection and Privacy Act, 2019, you may have rights
            to access, correct, or request deletion of your personal data, and to lodge a
            complaint with the Personal Data Protection Office.
          </p>

          <h2 className="text-lg font-bold mt-6">6. Contact</h2>
          <p>
            Questions can be raised through in-app Support or at [support email — pending].
          </p>

          <p className="pt-4 text-slate-400 text-xs">
            The complete draft policy is available on request while this page is finalized.
          </p>
        </div>
      </div>
    </div>
  );
}