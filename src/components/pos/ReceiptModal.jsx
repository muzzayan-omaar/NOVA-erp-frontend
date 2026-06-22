import { X, Printer, CheckCircle } from "lucide-react";

export default function ReceiptModal({ open, onClose, sale }) {
  if (!open || !sale) return null;

  const { 
    items = [], 
    totalAmount = 0, 
    paymentMethod = "CASH", 
    createdAt,
    subtotal,
    vatAmount 
  } = sale;

  const date = createdAt ? new Date(createdAt) : new Date();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center">
          <CheckCircle className="mx-auto mb-3 text-green-400" size={48} />
          <h2 className="text-2xl font-bold">NOVA HARDWARE STORE</h2>
          <p className="text-slate-400 text-sm">Kampala, Uganda</p>
          <p className="text-xs text-slate-500 mt-2">EFRIS Compliant • VAT Registered</p>
        </div>

        <div className="p-6 text-sm leading-relaxed">
          <div className="text-center text-xs text-slate-500 mb-4">
            {date.toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br />
            {date.toLocaleTimeString('en-UG')}
          </div>

          {/* Items */}
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div>
                  <span>{item.name}</span>
                  <span className="text-slate-500 ml-2">×{item.qty}</span>
                </div>
                <span className="font-medium">
                  UGX {(item.qty * item.sellingPrice).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed my-5" />

          {/* Tax Breakdown */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span>Net Amount</span>
              <span>UGX {subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span>VAT Included (18%)</span>
              <span>UGX {vatAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-3 mt-2">
              <span>Total Paid</span>
              <span>UGX {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 mt-6">
            Payment: <span className="capitalize font-medium">{paymentMethod.replace('_', ' ')}</span>
          </div>

          {/* EFRIS QR Placeholder */}
          <div className="mt-8 border border-dashed border-slate-300 rounded-2xl p-6 text-center">
            <div className="mx-auto w-28 h-28 border-2 border-slate-300 rounded-xl flex items-center justify-center text-xs text-slate-400 mb-3">
              [ EFRIS QR CODE ]
            </div>
            <p className="text-[10px] text-slate-500">Scan to verify with URA EFRIS System</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3 bg-slate-50">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
          >
            <Printer size={20} />
            Print Receipt
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-slate-200 hover:bg-slate-300 py-4 rounded-2xl font-semibold"
          >
            Close
          </button>
        </div>

        <div className="text-center text-[10px] text-slate-400 pb-4">
          Thank You • Powered by Nova ERP Uganda
        </div>
      </div>
    </div>
  );
}