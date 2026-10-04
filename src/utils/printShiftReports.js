const METHOD_LABELS = {
  CASH: "Cash",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Card",
  CREDIT: "Credit",
  MIXED: "Mixed",
  BANK_TRANSFER: "Bank Transfer",
};

export const printShiftReports = (shift, cashierName, storeName) => {
  const printWindow = window.open("", "_blank", "width=380,height=600");

  const methodRows = Object.entries(shift.totalByMethod || {})
    .map(([method, amount]) => `<div class="row"><span>${METHOD_LABELS[method] || method}</span><span>UGX ${amount.toLocaleString()}</span></div>`)
    .join("");

  const productRows = (shift.productMix || [])
    .map((p) => `<div class="row"><span>${p.name} × ${p.qty}</span><span>UGX ${p.revenue.toLocaleString()}</span></div>`)
    .join("");

  const varianceLabel = shift.cashVariance < 0 ? "SHORTAGE" : shift.cashVariance > 0 ? "OVERAGE" : "BALANCED";
  const varianceColor = shift.cashVariance < 0 ? "#dc2626" : shift.cashVariance > 0 ? "#d97706" : "#16a34a";

  printWindow.document.write(`
    <html>
      <head>
        <title>Shift Report</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 16px; font-size: 12px; }
          h2 { text-align: center; margin: 4px 0; font-size: 14px; }
          .meta { text-align: center; color: #555; margin-bottom: 12px; }
          .section { border-top: 1px dashed #000; margin-top: 12px; padding-top: 8px; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total { font-weight: bold; border-top: 1px solid #000; margin-top: 6px; padding-top: 6px; }
          .variance { text-align: center; font-weight: bold; margin-top: 10px; color: ${varianceColor}; }
          .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #777; }
        </style>
      </head>
      <body onload="window.print()">
        <h2>NOVA ERP</h2>
        <div class="meta">
          ${storeName}<br/>
          Cashier: ${cashierName}<br/>
          ${new Date(shift.openedAt).toLocaleString()} —<br/>${new Date(shift.closedAt || Date.now()).toLocaleString()}
        </div>

        <div class="section">
          <strong>TILL / CASH DRAWER</strong>
          <div class="row"><span>Opening Float</span><span>UGX ${shift.openingFloat.toLocaleString()}</span></div>
          <div class="row"><span>Cash from Sales</span><span>UGX ${(shift.expectedCash - shift.openingFloat).toLocaleString()}</span></div>
          <div class="row total"><span>Expected Cash</span><span>UGX ${shift.expectedCash.toLocaleString()}</span></div>
          <div class="row"><span>Counted Cash</span><span>UGX ${shift.countedCash.toLocaleString()}</span></div>
          <div class="variance">${varianceLabel}: UGX ${Math.abs(shift.cashVariance).toLocaleString()}</div>
        </div>

        <div class="section">
          <strong>SALES SUMMARY</strong>
          <div class="row"><span>Transactions</span><span>${shift.transactionCount}</span></div>
          ${methodRows}
          <div class="row total"><span>Total Sales</span><span>UGX ${shift.totalSales.toLocaleString()}</span></div>
        </div>

        <div class="section">
          <strong>PRODUCT MIX</strong>
          ${productRows || "<p>No items sold</p>"}
        </div>

        <div class="footer">Thank you — end of shift report</div>
      </body>
    </html>
  `);
  printWindow.document.close();
};