import { Wallet } from "lucide-react";

const METHOD_LABELS = {
  CASH: "Cash",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Card",
  CREDIT: "Credit",
  MIXED: "Mixed",
  BANK_TRANSFER: "Bank Transfer",
};

export default function FinanceSummaryCard({ finance }) {
  if (!finance) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-5">
        <Wallet size={20} /> Finance Summary (30 days)
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs text-slate-500">Gross Profit</p>
          <p className="text-xl font-bold">UGX {finance.grossProfit.toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs text-slate-500">Profit Margin</p>
          <p className="text-xl font-bold">{finance.profitMargin.toFixed(1)}%</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs text-slate-500">VAT Collected</p>
          <p className="text-xl font-bold">UGX {finance.vatCollected.toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs text-slate-500">Discounts Given</p>
          <p className="text-xl font-bold">UGX {finance.discounts.toLocaleString()}</p>
        </div>
      </div>

      {finance.paymentMethods?.length > 0 && (
        <>
          <p className="text-xs text-slate-500 font-medium mb-2">Payment Method Breakdown</p>
          <div className="space-y-2">
            {finance.paymentMethods.map((m) => (
              <div key={m.method} className="flex justify-between text-sm border-b py-2">
                <span>{METHOD_LABELS[m.method] || m.method} ({m.transactions})</span>
                <span className="font-semibold">UGX {m.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}