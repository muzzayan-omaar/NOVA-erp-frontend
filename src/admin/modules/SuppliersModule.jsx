import { useEffect, useState } from "react";
import api from "../../services/api";
import { Plus, Edit2, Trash2, Truck } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

export default function SuppliersModule() {
  const { user } = useAuthStore();
  const [suppliers, setSuppliers] = useState([]);
  const [loading,setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    totalOwed: 0
  });

  const fetchSuppliers = async () => {

  try {

    setLoading(true);

    const res = await api.get("/suppliers");

    setSuppliers(res.data);


  } catch(err){

    console.error(err);

    toast.error(
      err.response?.data?.message ||
      "Failed to load suppliers"
    );


  } finally {

    setLoading(false);

  }

};

  useEffect(()=>{

  if(user?.activeStoreId || user?.storeId){

    fetchSuppliers();

  }

},[
  user?.activeStoreId,
  user?.storeId
]);

  const createSupplier = async () => {
  try {
    if (!form.name) {
      toast.error("Supplier name is required");
      return;
    }

    await api.post("/suppliers", form);

    toast.success("Supplier added");

    resetForm();
    setMode("list");

    // 🔥 reload from backend (source of truth)
    fetchSuppliers();
  } catch (err) {
    toast.error("Failed to create supplier");
  }
};

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "", address: "", totalOwed: 0 });
  };

  const updateSupplier = async () => {
  try {
    await api.put(`/suppliers/${selectedSupplier.id}`, form);
    toast.success("Supplier updated");
    setMode("list");
    fetchSuppliers();
  } catch (err) {
    toast.error("Update failed");
  }
};

const deleteSupplier = async () => {
  try {
    await api.delete(`/suppliers/${selectedSupplier.id}`);
    toast.success("Supplier deleted");
    setMode("list");
    fetchSuppliers();
  } catch (err) {
    toast.error("Delete failed");
  }
};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Truck /> Suppliers & Procurement
        </h1>
        <button
          onClick={() => { setMode("create"); resetForm(); }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> New Supplier
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-5">


<div className="bg-white rounded-3xl shadow p-6">

<p className="text-slate-500">
Total Suppliers
</p>

<p className="text-3xl font-bold">
{suppliers.length}
</p>

</div>



<div className="bg-white rounded-3xl shadow p-6">

<p className="text-slate-500">
Outstanding Debt
</p>


<p className="text-3xl font-bold text-red-600">

UGX {
suppliers
.reduce(
(sum,s)=>sum + Number(s.totalOwed || 0),
0
)
.toLocaleString()

}

</p>

</div>



<div className="bg-white rounded-3xl shadow p-6">

<p className="text-slate-500">
Store
</p>

<p className="text-xl font-bold">

{user?.activeStore?.name || "Current Store"}

</p>

</div>


</div>

      <div className="grid grid-cols-12 gap-6">
        {/* Suppliers List */}
        <div className="col-span-5 bg-white rounded-3xl shadow p-6">
          <h2 className="font-bold text-lg mb-4">All Suppliers</h2>
          <div className="space-y-3 max-h-[600px] overflow-auto">
            {
loading ? (

<p className="text-slate-500 py-10 text-center">
Loading suppliers...
</p>

)

:

suppliers.length === 0 ? (
              <p className="text-slate-500 py-10 text-center">No suppliers yet</p>
            ) : (
              suppliers.map(s => (
                <div key={s.id} className="p-4 border rounded-2xl hover:bg-slate-50 cursor-pointer transition" onClick={() => { setSelectedSupplier(s); setForm(s); setMode("edit"); }}>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-slate-500">{s.phone}</div>
                  {s.totalOwed > 0 && (
                    <div className="text-red-600 font-medium mt-1">Owed: UGX {Number(
s.totalOwed || 0
).toLocaleString()}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Form */}
        <div className="col-span-7 bg-white rounded-3xl shadow p-8">
          {mode === "list" && (
            <div className="h-full flex items-center justify-center text-slate-400 text-lg">
              Select a supplier or click "New Supplier"
            </div>
          )}

          {(mode === "create" || mode === "edit") && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">
                {mode === "create" ? "New Supplier" : "Edit Supplier"}
              </h2>

              <input placeholder="Supplier Name" className="w-full p-4 border rounded-2xl" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />

              <input placeholder="Phone Number" className="w-full p-4 border rounded-2xl" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />

              <input placeholder="Email" type="email" className="w-full p-4 border rounded-2xl" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />

              <textarea placeholder="Address" className="w-full p-4 border rounded-2xl h-24" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />

              <input type="number" placeholder="Amount Owed" className="w-full p-4 border rounded-2xl" value={form.totalOwed} onChange={e => setForm({...form, totalOwed: parseFloat(e.target.value) || 0})} />

              <div className="flex gap-4 pt-4">
                <button onClick={mode === "create" ? createSupplier : updateSupplier} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-semibold">
                  {mode === "create" ? "Add Supplier" : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}