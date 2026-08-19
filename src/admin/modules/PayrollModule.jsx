import { useEffect, useState } from "react";
import api from "../../services/api";
import { DollarSign, Plus, X, CheckCircle2, Download } from "lucide-react";
import toast from "react-hot-toast";
import { exportReportCsv } from "../../utils/reportExport";

// Mirrors backend src/utils/payrollTax.js exactly — used only for the
// live preview as a manager types. The backend always recomputes and
// is the real source of truth; this is display convenience only.
const calculatePAYEPreview = (grossSalary) => {
  const salary = Number(grossSalary) || 0;
  let paye = 0;

  if (salary <= 235000) paye = 0;
  else if (salary <= 335000) paye = (salary - 235000) * 0.10;
  else if (salary <= 410000) paye = 10000 + (salary - 335000) * 0.20;
  else {
    paye = 25000 + (salary - 410000) * 0.30;
    if (salary > 10000000) paye += (salary - 10000000) * 0.10;
  }

  return Math.round(paye);
};

export default function PayrollModule() {
  const [staff, setStaff] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  const [form, setForm] = useState({
    userId: "",
    basicSalary: "",
    allowances: "0",
    bonus: "0",
    otherDeductions: "0",
    month: new Date().toISOString().slice(0, 7),
    notes: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, payrollRes] = await Promise.all([
        api.get("/users"),
        api.get("/payroll", { params: monthFilter ? { month: monthFilter } : {} }),
      ]);
      setStaff(staffRes.data);
      setPayrollRecords(payrollRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter]);

  const createPayroll = async (e) => {
    e.preventDefault();

    if (!form.userId || !form.basicSalary) {
      toast.error("Staff member and basic salary are required");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/payroll", form);
      toast.success("Payroll recorded");
      setForm({
        userId: "", basicSalary: "", allowances: "0", bonus: "0",
        otherDeductions: "0", month: new Date().toISOString().slice(0, 7), notes: "",
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payroll");
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async (id) => {
    try {
      await api.post(`/payroll/${id}/pay`);
      toast.success("Marked as paid");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const downloadNssfReturn = async () => {
    try {
      const res = await api.get("/payroll/nssf-return", { params: { month: monthFilter } });
      exportReportCsv({
        title: `NSSF Return ${monthFilter}`,
        columns: ["Employee", "Gross Salary", "Employee 5%", "Employer 10%", "Total"],
        rows: res.data.rows.map((r) => [
          r.employee,
          r.grossSalary,
          r.nssfEmployee,
          r.nssfEmployer,
          r.nssfTotal,
        ]),
      });
    } catch (err) {
      toast.error("Failed to generate NSSF return");
    }
  };

  // Live preview math
  const grossPreview =
    (Number(form.basicSalary) || 0) + (Number(form.allowances) || 0) + (Number(form.bonus) || 0);
  const nssfEmployeePreview = Math.round(grossPreview * 0.05);
  const nssfEmployerPreview = Math.round(grossPreview * 0.10);
  const payePreview = calculatePAYEPreview(grossPreview);
  const netPreview = grossPreview - nssfEmployeePreview - payePreview - (Number(form.otherDeductions) || 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <DollarSign /> Payroll
        </h1>
        <div className="flex gap-3">
          <input
            type="month"
            className="p-3 border rounded-2xl"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
          <button
            onClick={downloadNssfReturn}
            className="flex items-center gap-2 bg-slate-200 px-5 py-3 rounded-2xl font-medium"
          >
            <Download size={18} /> NSSF Return
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2"
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            {showForm ? "Cancel" : "Add Payroll"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="grid md:grid-cols-3 gap-6">
          <form onSubmit={createPayroll} className="md:col-span-2 bg-white rounded-3xl shadow p-8 space-y-4">
            <select
              className="w-full p-4 border rounded-2xl"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
            >
              <option value="">Select staff member</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
              ))}
            </select>

            <input
              type="month"
              className="w-full p-4 border rounded-2xl"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
            />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500">Basic Salary</label>
                <input
                  type="number"
                  className="w-full p-3 border rounded-xl mt-1"
                  value={form.basicSalary}
                  onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Allowances</label>
                <input
                  type="number"
                  className="w-full p-3 border rounded-xl mt-1"
                  value={form.allowances}
                  onChange={(e) => setForm({ ...form, allowances: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Bonus</label>
                <input
                  type="number"
                  className="w-full p-3 border rounded-xl mt-1"
                  value={form.bonus}
                  onChange={(e) => setForm({ ...form, bonus: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500">Other Deductions (loans, advances)</label>
              <input
                type="number"
                className="w-full p-3 border rounded-xl mt-1"
                value={form.otherDeductions}
                onChange={(e) => setForm({ ...form, otherDeductions: e.target.value })}
              />
            </div>

            <input
              placeholder="Notes (optional)"
              className="w-full p-4 border rounded-2xl"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Record Payroll"}
            </button>
          </form>

          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-3 h-fit sticky top-6">
            <h3 className="font-bold text-sm uppercase tracking-wide text-slate-400">
              Live Breakdown
            </h3>
            <Row label="Gross Salary" value={grossPreview} />
            <Row label="NSSF (Employee 5%)" value={-nssfEmployeePreview} />
            <Row label="PAYE Tax" value={-payePreview} />
            <Row label="Other Deductions" value={-(Number(form.otherDeductions) || 0)} />
            <div className="border-t border-slate-700 pt-3 flex justify-between font-bold text-lg">
              <span>Net Pay</span>
              <span>UGX {netPreview.toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-400 pt-2">
              Employer also pays UGX {nssfEmployerPreview.toLocaleString()} NSSF (10%) — not deducted from salary.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow p-6">
        <h2 className="font-bold text-lg mb-4">Payroll Records — {monthFilter}</h2>
        {loading ? (
          <p className="text-center text-slate-500 py-10">Loading...</p>
        ) : payrollRecords.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No payroll records for this month</p>
        ) : (
          <div className="space-y-3">
            {payrollRecords.map((p) => (
              <div key={p.id} className="border rounded-2xl p-5 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{p.user?.name}</p>
                  <p className="text-sm text-slate-500">
                    Gross UGX {p.grossSalary.toLocaleString()} · PAYE UGX {p.payeTax.toLocaleString()} · NSSF UGX {p.nssfEmployee.toLocaleString()}
                  </p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-bold text-lg">UGX {p.netPay.toLocaleString()}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        p.status === "PAID" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  {p.status !== "PAID" && (
                    <button
                      onClick={() => markPaid(p.id)}
                      className="flex items-center gap-2 text-sm font-medium text-green-600 px-4 py-2 rounded-xl border border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle2 size={16} /> Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-slate-300">
      <span>{label}</span>
      <span>{value < 0 ? "-" : ""}UGX {Math.abs(value).toLocaleString()}</span>
    </div>
  );
}