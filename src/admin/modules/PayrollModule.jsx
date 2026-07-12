import { useEffect, useState } from "react";
import api from "../../services/api";
import { DollarSign, Plus, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export default function PayrollModule() {
  const [staff, setStaff] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [mode, setMode] = useState("list");
  const [form, setForm] = useState({
    userId: "",
    salary: "",
    month: new Date().toISOString().slice(0, 7),
    bonus: 0,
    deductions: 0
  });

  const fetchData = async () => {

try{

const staffRes = await api.get("/users");

setStaff(staffRes.data);



const payrollRes = await api.get("/payroll");

setPayrollRecords(payrollRes.data);



}catch(err){

console.error(err);

toast.error("Failed to load payroll data");

}

};

  useEffect(() => {
    fetchData();
  }, []);

  const createPayroll = async()=>{

try{


if(!form.userId || !form.salary){

toast.error("Staff and salary are required");
return;

}



await api.post("/payroll",form);



toast.success("Payroll recorded");


fetchData();


resetForm();

setMode("list");



}catch(err){

console.error(err);

toast.error(
err.response?.data?.message ||
"Failed to create payroll"
);

}

};

  const resetForm = () => {
    setForm({
      userId: "",
      salary: "",
      month: new Date().toISOString().slice(0, 7),
      bonus: 0,
      deductions: 0
    });
  };

  const totalPayroll = payrollRecords.reduce((sum, r) => sum + r.netPay, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <DollarSign /> Payroll Management
        </h1>
        <button
          onClick={() => { setMode("create"); resetForm(); }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> Record Payroll
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">Total Payroll This Month</h2>
          <p className="text-3xl font-bold text-green-600">UGX {totalPayroll.toLocaleString()}</p>
        </div>

        {mode === "create" && (
          <div className="bg-slate-50 p-8 rounded-3xl mb-8">
            <select
              className="w-full p-4 border rounded-2xl mb-4"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
            >
              <option value="">Select Staff</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Basic Salary"
                className="p-4 border rounded-2xl"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
              />
              <input
                type="month"
                className="p-4 border rounded-2xl"
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <input
                type="number"
                placeholder="Bonus"
                className="p-4 border rounded-2xl"
                value={form.bonus}
                onChange={(e) => setForm({ ...form, bonus: e.target.value })}
              />
              <input
                type="number"
                placeholder="Deductions"
                className="p-4 border rounded-2xl"
                value={form.deductions}
                onChange={(e) => setForm({ ...form, deductions: e.target.value })}
              />
            </div>

            <button
              onClick={createPayroll}
              className="mt-6 w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold"
            >
              Record Payroll
            </button>
          </div>
        )}

        <div className="space-y-3 max-h-[500px] overflow-auto">
          {payrollRecords.length === 0 ? (
            <p className="text-slate-500 py-10 text-center">No payroll records yet</p>
          ) : (
            payrollRecords.map(record => (
              <div key={record.id} className="flex justify-between items-center p-5 border rounded-2xl">
                <div>
                  <p className="font-medium">record.user?.name</p>
                  <p className="text-xs text-slate-500">{record.month}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">UGX {record.netPay.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Net Pay</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}