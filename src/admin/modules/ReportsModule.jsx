import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  FileText,
  BookOpen,
  ShoppingBag,
  Boxes,
  TrendingUp,
  Wallet,
  Users,
  Percent,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { exportReportPdf, exportReportCsv } from "../../utils/reportExport";

const TABS = [
  { key: "day-book", label: "Day Book", icon: BookOpen },
  { key: "sales", label: "Sales Report", icon: ShoppingBag },
  { key: "stock-summary", label: "Stock Summary", icon: Boxes },
  { key: "profit-loss", label: "Profit & Loss", icon: TrendingUp },
  { key: "cash-flow", label: "Cash Flow", icon: Wallet },
  { key: "receivables-payables", label: "Receivables & Payables", icon: Users },
  { key: "vat-summary", label: "VAT Summary", icon: Percent },
  { key: "nssf-return", label: "NSSF Return", icon: Percent },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function ReportsModule() {
  const [tab, setTab] = useState("day-book");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(todayStr());
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());

  const fetchReport = async () => {
  try {
    setLoading(true);
    let params = {};
    let url = `/reports/${tab}`;

    if (tab === "day-book") {
      params = { date };
    } else if (tab === "nssf-return") {
      // Call the existing payroll endpoint
      url = `/payroll/nssf-return`;
      params = { month: from.slice(0, 7) }; // e.g. "2026-08"
    } else if (tab !== "stock-summary" && tab !== "receivables-payables") {
      params = { from, to };
    }

    const res = await api.get(url, { params });
    setData(res.data);
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.message || "Failed to load report");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, date, from, to]);

  const { columns, rows, summaryLines, reportTitle } = buildExportShape(tab, loading ? null : data);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText /> Reports
        </h1>

        {data && (
          <div className="flex gap-3">
            <button
              onClick={() =>
                exportReportPdf({ title: reportTitle, subtitle: dateSubtitle(tab, date, from, to), columns, rows, summaryLines })
              }
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-medium"
            >
              <Download size={18} /> PDF
            </button>
            <button
              onClick={() => exportReportCsv({ title: reportTitle, columns, rows })}
              className="flex items-center gap-2 bg-slate-200 px-5 py-3 rounded-2xl font-medium"
            >
              <FileSpreadsheet size={18} /> CSV
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition ${
                tab === t.key ? "bg-blue-600 text-white" : "bg-white text-slate-600 shadow"
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl shadow p-5 flex gap-4 items-end flex-wrap">
        {tab === "day-book" ? (
          <div>
            <label className="text-xs text-slate-500">Date</label>
            <input
              type="date"
              className="w-full p-3 border rounded-xl mt-1"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        ) : tab === "nssf-return" ? (
          <div>
            <label className="text-xs text-slate-500">Month</label>
            <input
              type="month"
              className="w-full p-3 border rounded-xl mt-1"
              value={from.slice(0, 7)} // reuse `from` as month
              onChange={(e) => {
                setFrom(e.target.value + "-01");
                setTo(e.target.value + "-01");
              }}
            />
          </div>
        ) : tab !== "stock-summary" && tab !== "receivables-payables" ? (
          <>
            <div>
              <label className="text-xs text-slate-500">From</label>
              <input
                type="date"
                className="w-full p-3 border rounded-xl mt-1"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">To</label>
              <input
                type="date"
                className="w-full p-3 border rounded-xl mt-1"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">Real-time snapshot — no date range needed</p>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        {loading ? (
          <p className="text-center py-16">Loading report...</p>
        ) : (
          <ReportBody tab={tab} data={data} />
        )}
      </div>
    </div>
  );
}

/* ---------- Report bodies ---------- */

function ReportBody({ tab, data }) {
  if (!data) return null;

  if (tab === "day-book") return <DayBookBody data={data} />;
  if (tab === "sales") return <SalesReportBody data={data} />;
  if (tab === "stock-summary") return <StockSummaryBody data={data} />;
  if (tab === "profit-loss") return <ProfitLossBody data={data} />;
  if (tab === "cash-flow") return <CashFlowBody data={data} />;
  if (tab === "receivables-payables") return <ReceivablesPayablesBody data={data} />;
  if (tab === "vat-summary") return <VatSummaryBody data={data} />;
  if (tab === "nssf-return") return <NssfReturnBody data={data} />;
  return null;
}

function DayBookBody({ data }) {
  const entries = data.entries || [];

  if (entries.length === 0) {
    return <p className="text-center text-slate-500 py-10">No activity this day</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map((e, i) => (
        <div key={i} className="flex justify-between items-center border-b py-3 text-sm">
          <div>
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-xs font-semibold mr-2">
              {e.type?.replace(/_/g, " ") || "—"}
            </span>
            {e.description}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {e.time ? new Date(e.time).toLocaleTimeString() : "—"}
            </span>
            {e.amount != null && (
              <span
                className={`font-semibold ${
                  e.direction === "OUT" ? "text-red-600" : "text-green-600"
                }`}
              >
                {e.direction === "OUT" ? "-" : "+"}UGX{" "}
                {Number(e.amount).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesReportBody({ data }) {
  const totals = data.totals || {
    subtotal: 0,
    vatAmount: 0,
    discount: 0,
    totalAmount: 0,
  };
  const sales = data.sales || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Subtotal" value={totals.subtotal} />
        <Stat label="VAT" value={totals.vatAmount} />
        <Stat label="Discounts" value={totals.discount} />
        <Stat label="Total" value={totals.totalAmount} highlight />
      </div>

      {sales.length === 0 ? (
        <p className="text-center text-slate-500 py-10">No sales in this range</p>
      ) : (
        <div className="space-y-2">
          {sales.map((s) => (
            <div key={s.id} className="flex justify-between border-b py-3 text-sm">
              <span>
                {new Date(s.createdAt).toLocaleString()} · {s.user?.name}
                {s.customer ? ` · ${s.customer.name}` : ""}
              </span>
              <span className="font-semibold">
                UGX {Number(s.totalAmount ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StockSummaryBody({ data }) {
  const totals = data.totals || { quantity: 0, stockValue: 0, potentialProfit: 0 };
  const rows = data.rows || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total Units" value={totals.quantity} isCount />
        <Stat label="Stock Value" value={totals.stockValue} />
        <Stat label="Potential Profit" value={totals.potentialProfit} />
      </div>

      {rows.length === 0 ? (
        <p className="text-center text-slate-500 py-10">No stock data</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex justify-between border-b py-3 text-sm">
              <span>
                {r.name} ({r.sku}) × {r.quantity}
              </span>
              <span className="font-semibold">
                UGX {Number(r.stockValue ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfitLossBody({ data }) {
  const Row = ({ label, value, bold, indent }) => (
    <div
      className={`flex justify-between py-2 ${
        bold ? "font-bold border-t pt-3 mt-2" : ""
      } ${indent ? "pl-4 text-slate-500 text-sm" : ""}`}
    >
      <span>{label}</span>
      <span>UGX {Number(value ?? 0).toLocaleString()}</span>
    </div>
  );

  const expenseBreakdown = data.expenseBreakdown || {};

  return (
    <div className="max-w-xl mx-auto">
      <Row label="Revenue" value={data.revenue} />
      <Row label="Cost of Goods Sold" value={-(data.cogs ?? 0)} indent />
      <Row label="Gross Profit" value={data.grossProfit} bold />
      <Row label="Operating Expenses" value={-(data.operatingExpenses ?? 0)} indent />
      <Row label="Payroll" value={-(data.payrollCost ?? 0)} indent />
      <Row label="Net Profit" value={data.netProfit} bold />

      {Object.keys(expenseBreakdown).length > 0 && (
        <div className="mt-8">
          <h3 className="font-bold mb-3">Expense Breakdown</h3>
          {Object.entries(expenseBreakdown).map(([cat, amt]) => (
            <div key={cat} className="flex justify-between text-sm py-1 text-slate-500">
              <span>{cat}</span>
              <span>UGX {Number(amt ?? 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CashFlowBody({ data }) {
  const money = (v) => Number(v ?? 0).toLocaleString();

  function Row({ label, value, bold }) {
    return (
      <div
        className={`flex justify-between py-2 ${
          bold ? "font-bold border-t pt-2 mt-1" : "text-sm text-slate-600"
        }`}
      >
        <span>{label}</span>
        <span>UGX {money(value)}</span>
      </div>
    );
  }

  const net = data.netCashFlow ?? 0;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h3 className="font-bold text-green-600 mb-2">Cash In</h3>
        <Row label="From Cash Sales" value={data.cashInFromSales} />
        <Row label="From Customer Payments" value={data.cashInFromCustomers} />
        <Row label="Total Cash In" value={data.totalCashIn} bold />
      </div>

      <div>
        <h3 className="font-bold text-red-600 mb-2">Cash Out</h3>
        <Row label="Expenses" value={data.cashOutExpenses} />
        <Row label="Payroll" value={data.cashOutPayroll} />
        <Row label="Total Cash Out" value={data.totalCashOut} bold />
      </div>

      <div
        className={`text-xl font-bold border-t pt-4 flex justify-between ${
          net >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        <span>Net Cash Flow</span>
        <span>UGX {money(net)}</span>
      </div>
    </div>
  );
}

function ReceivablesPayablesBody({ data }) {
  const receivables = data.receivables || { total: 0, customers: [] };
  const payables = data.payables || { total: 0, suppliers: [] };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="font-bold text-red-600 mb-4">
          Receivables — UGX {Number(receivables.total).toLocaleString()}
        </h3>
        {receivables.customers.length === 0 ? (
          <p className="text-slate-400 text-sm">Nothing outstanding</p>
        ) : (
          receivables.customers.map((c) => (
            <div key={c.id} className="flex justify-between border-b py-3 text-sm">
              <span>{c.name}</span>
              <span className="font-semibold">
                UGX {Number(c.totalCredit ?? 0).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      <div>
        <h3 className="font-bold text-amber-600 mb-4">
          Payables — UGX {Number(payables.total).toLocaleString()}
        </h3>
        {payables.suppliers.length === 0 ? (
          <p className="text-slate-400 text-sm">Nothing outstanding</p>
        ) : (
          payables.suppliers.map((s) => (
            <div key={s.id} className="flex justify-between border-b py-3 text-sm">
              <span>{s.name}</span>
              <span className="font-semibold">
                UGX {Number(s.totalOwed ?? 0).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function VatSummaryBody({ data }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Stat label="Taxable Sales" value={data.taxableSales} />
      <Stat label="VAT Collected (18%)" value={data.vatCollected} highlight />
      <Stat label="Total Sales" value={data.totalSales} />
      <Stat label="Transactions" value={data.transactionCount} isCount />
    </div>
  );
}

function Stat({ label, value, highlight, isCount }) {
  return (
    <div className={`p-5 rounded-2xl ${highlight ? "bg-blue-50" : "bg-slate-50"}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-blue-600" : ""}`}>
        {isCount ? value : `UGX ${Number(value).toLocaleString()}`}
      </p>
    </div>
  );
}

/* ---------- Export shaping ---------- */

function dateSubtitle(tab, date, from, to) {
  if (tab === "day-book") return `For ${date}`;
  if (tab === "stock-summary" || tab === "receivables-payables") return "Real-time snapshot";
  return `${from} to ${to}`;
}

function buildExportShape(tab, data) {
  if (!data) return { columns: [], rows: [], summaryLines: [], reportTitle: "" };

  const titles = {
    "day-book": "Day Book",
    sales: "Sales Report",
    "stock-summary": "Stock Summary",
    "profit-loss": "Profit and Loss Statement",
    "cash-flow": "Cash Flow Summary",
    "receivables-payables": "Receivables and Payables",
    "vat-summary": "VAT Summary",
  };

  const money = (v) => `UGX ${Number(v ?? 0).toLocaleString()}`;

  if (tab === "day-book") {
    return {
      reportTitle: titles[tab],
      columns: ["Time", "Type", "Description", "Amount"],
      rows: (data.entries || []).map((e) => [
        new Date(e.time).toLocaleTimeString(),
        e.type?.replace(/_/g, " ") || "—",
        e.description || "—",
        e.amount != null ? money(e.amount) : "—",
      ]),
      summaryLines: [],
    };
  }

  if (tab === "sales") {
    return {
      reportTitle: titles[tab],
      columns: ["Date", "Cashier", "Customer", "Amount"],
      rows: (data.sales || []).map((s) => [
        new Date(s.createdAt).toLocaleString(),
        s.user?.name || "—",
        s.customer?.name || "Walk-in",
        money(s.totalAmount),
      ]),
      summaryLines: [
        `Total: ${money(data.totals?.totalAmount)} across ${data.count ?? 0} sale(s)`,
      ],
    };
  }

  if (tab === "stock-summary") {
    return {
      reportTitle: titles[tab],
      columns: ["Product", "SKU", "Qty", "Stock Value", "Potential Profit"],
      rows: (data.rows || []).map((r) => [
        r.name,
        r.sku,
        r.quantity,
        money(r.stockValue),
        money(r.potentialProfit),
      ]),
      summaryLines: [`Total Stock Value: ${money(data.totals?.stockValue)}`],
    };
  }

  if (tab === "profit-loss") {
    return {
      reportTitle: titles[tab],
      columns: ["Line", "Amount"],
      rows: [
        ["Revenue", money(data.revenue)],
        ["Cost of Goods Sold", `-${money(data.cogs)}`],
        ["Gross Profit", money(data.grossProfit)],
        ["Operating Expenses", `-${money(data.operatingExpenses)}`],
        ["Payroll", `-${money(data.payrollCost)}`],
        ["Net Profit", money(data.netProfit)],
      ],
      summaryLines: [],
    };
  }

  if (tab === "cash-flow") {
    return {
      reportTitle: titles[tab],
      columns: ["Line", "Amount"],
      rows: [
        ["Cash In — Sales", money(data.cashInFromSales)],
        ["Cash In — Customer Payments", money(data.cashInFromCustomers)],
        ["Total Cash In", money(data.totalCashIn)],
        ["Cash Out — Expenses", money(data.cashOutExpenses)],
        ["Cash Out — Payroll", money(data.cashOutPayroll)],
        ["Total Cash Out", money(data.totalCashOut)],
        ["Net Cash Flow", money(data.netCashFlow)],
      ],
      summaryLines: [],
    };
  }

  if (tab === "receivables-payables") {
    return {
      reportTitle: titles[tab],
      columns: ["Type", "Name", "Amount"],
      rows: [
        ...(data.receivables?.customers || []).map((c) => [
          "Receivable",
          c.name,
          money(c.totalCredit),
        ]),
        ...(data.payables?.suppliers || []).map((s) => [
          "Payable",
          s.name,
          money(s.totalOwed),
        ]),
      ],
      summaryLines: [
        `Total Receivables: ${money(data.receivables?.total)}`,
        `Total Payables: ${money(data.payables?.total)}`,
      ],
    };
  }

  if (tab === "vat-summary") {
    return {
      reportTitle: titles[tab],
      columns: ["Line", "Amount"],
      rows: [
        ["Taxable Sales", money(data.taxableSales)],
        ["VAT Collected (18%)", money(data.vatCollected)],
        ["Total Sales", money(data.totalSales)],
        ["Transactions", data.transactionCount ?? 0],
      ],
      summaryLines: [],
    };
  }

  if (tab === "nssf-return") {
  return {
    reportTitle: "NSSF Return",
    columns: ["Employee", "Gross Salary", "Employee NSSF", "Employer NSSF", "Total NSSF"],
    rows: (data.rows || []).map((r) => [
      r.employee,
      `UGX ${Number(r.grossSalary ?? 0).toLocaleString()}`,
      `UGX ${Number(r.nssfEmployee ?? 0).toLocaleString()}`,
      `UGX ${Number(r.nssfEmployer ?? 0).toLocaleString()}`,
      `UGX ${Number(r.nssfTotal ?? 0).toLocaleString()}`,
    ]),
    summaryLines: [
      `Total Gross: UGX ${Number(data.totals?.grossSalary ?? 0).toLocaleString()}`,
      `Total Employee NSSF: UGX ${Number(data.totals?.nssfEmployee ?? 0).toLocaleString()}`,
      `Total Employer NSSF: UGX ${Number(data.totals?.nssfEmployer ?? 0).toLocaleString()}`,
      `Grand Total NSSF: UGX ${Number(data.totals?.nssfTotal ?? 0).toLocaleString()}`,
    ],
  };
}

  return { columns: [], rows: [], summaryLines: [], reportTitle: "" };
}

function NssfReturnBody({ data }) {
  const rows = data.rows || [];
  const totals = data.totals || {
    grossSalary: 0,
    nssfEmployee: 0,
    nssfEmployer: 0,
    nssfTotal: 0,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Gross" value={totals.grossSalary} />
        <Stat label="Employee NSSF (5%)" value={totals.nssfEmployee} />
        <Stat label="Employer NSSF (10%)" value={totals.nssfEmployer} />
        <Stat label="Total NSSF" value={totals.nssfTotal} highlight />
      </div>

      {rows.length === 0 ? (
        <p className="text-center text-slate-500 py-10">No payroll records for this month</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex justify-between border-b py-3 text-sm">
              <span className="font-medium">{r.employee}</span>
              <div className="flex gap-6 text-right">
                <span>Gross: UGX {Number(r.grossSalary).toLocaleString()}</span>
                <span className="text-slate-500">
                  Emp: {Number(r.nssfEmployee).toLocaleString()}
                </span>
                <span className="text-slate-500">
                  Empr: {Number(r.nssfEmployer).toLocaleString()}
                </span>
                <span className="font-semibold">
                  Total: UGX {Number(r.nssfTotal).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}