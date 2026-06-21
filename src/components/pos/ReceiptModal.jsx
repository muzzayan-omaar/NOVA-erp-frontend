import { X, Printer, CheckCircle } from "lucide-react";

export default function ReceiptModal({ open, onClose, sale }) {
  if (!open || !sale) return null;

  const { items = [], totalAmount = 0, paymentMethod = "CASH", createdAt } = sale;
  const date = createdAt ? new Date(createdAt) : new Date();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white w-[400px] rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Receipt Header */}
        <div className="bg-slate-900 text-white p-6 text-center">
          <CheckCircle className="mx-auto mb-3 text-green-400" size={48} />
          <h2 className="text-2xl font-bold">Nova Hardware Store</h2>
          <p className="text-slate-400 text-sm mt-1">Kampala, Uganda • VAT Registered</p>
          <p className="text-xs text-slate-500 mt-3">
            {date.toLocaleDateString('en-UG')} {date.toLocaleTimeString('en-UG')}
          </p>
        </div>

        <div className="p-6 text-sm">
          {/* Items */}
          <div className="max-h-[320px] overflow-y-auto pr-2 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.qty} × UGX {item.sellingPrice.toLocaleString()}
                  </p>
                </div>
                <p className="font-medium text-right">
                  UGX {(item.qty * item.sellingPrice).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed my-5" />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between font-medium">
              <span>Subtotal</span>
              <span>UGX {totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (18%)</span>
              <span>UGX {(totalAmount * 0.18).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-3 mt-2">
              <span>Total</span>
              <span>UGX {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 mt-6">
            Payment: <span className="capitalize font-medium">{paymentMethod.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 border-t flex gap-3">
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

        {/* EFRIS Note */}
        <div className="text-center text-[10px] text-slate-400 pb-4">
          EFRIS Compliant • Official Receipt
        </div>
      </div>
    </div>
  );
}