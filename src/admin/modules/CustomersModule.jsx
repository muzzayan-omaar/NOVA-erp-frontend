import { useEffect, useState } from "react";
import api from "../../services/api";
import { UserPlus, Edit2, Trash2, Phone } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

export default function CustomersModule() {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [loading,setLoading] = useState(true);
  const [mode, setMode] = useState("list"); // list, create, edit
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    totalCredit: 0
  });

  const fetchCustomers = async () => {

  try {

    setLoading(true);

    const res = await api.get("/customers");

    setCustomers(res.data);


  } catch (err) {

    console.error(err);

    toast.error(
      err.response?.data?.message ||
      "Failed to load customers"
    );


  } finally {

    setLoading(false);

  }

};

  useEffect(()=>{

  if(user?.activeStoreId || user?.storeId){

    fetchCustomers();

  }

},[
  user?.activeStoreId,
  user?.storeId
]);

  const createCustomer = async () => {
    try {
      await api.post("/customers", form);
      toast.success("Customer added successfully");
      resetForm();
      setMode("list");
      fetchCustomers();
    } catch (err) {
      toast.error("Failed to create customer");
    }
  };

  const updateCustomer = async () => {
    try {
      await api.put(`/customers/${selectedCustomer.id}`, form);
      toast.success("Customer updated");
      setMode("list");
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error("Failed to update customer");
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success("Customer deleted");
      fetchCustomers();
    } catch (err) {
      toast.error("Failed to delete customer");
    }
  };

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "", totalCredit: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Phone /> Customers & Credit
        </h1>
        <button
          onClick={() => { setMode("create"); resetForm(); }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700"
        >
          <UserPlus size={20} /> New Customer
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-5">

<div className="bg-white rounded-3xl shadow p-6">
<p className="text-slate-500">
Total Customers
</p>

<p className="text-3xl font-bold">
{customers.length}
</p>
</div>


<div className="bg-white rounded-3xl shadow p-6">

<p className="text-slate-500">
Outstanding Credit
</p>

<p className="text-3xl font-bold text-red-600">

UGX {
customers
.reduce(
(sum,c)=>sum + Number(c.totalCredit || 0),
0
)
.toLocaleString()
}

</p>

</div>


<div className="bg-white rounded-3xl shadow p-6">

<p className="text-slate-500">
Active Store
</p>

<p className="text-xl font-bold">

{user?.activeStore?.name || "Current Store"}

</p>

</div>


</div>

      <div className="grid grid-cols-12 gap-6">
        {/* Customers List */}
        <div className="col-span-5 bg-white rounded-3xl shadow p-6">
          <h2 className="font-bold text-lg mb-4">All Customers</h2>
          <div className="space-y-3 max-h-[600px] overflow-auto">

{
loading ?

<p className="text-center text-slate-500">
Loading customers...
</p>

:

customers.map(c => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedCustomer(c);
                  setForm({
                    name: c.name,
                    phone: c.phone || "",
                    email: c.email || "",
                    totalCredit: c.totalCredit || 0
                  });
                  setMode("edit");
                }}
                className="p-4 border rounded-2xl hover:bg-slate-50 cursor-pointer transition flex justify-between"
              >
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">UGX {Number(c.totalCredit || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Credit</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Form */}
        <div className="col-span-7 bg-white rounded-3xl shadow p-8">
          {mode === "list" && (
            <div className="h-full flex items-center justify-center text-slate-400">
              Select a customer or click "New Customer"
            </div>
          )}

          {(mode === "create" || mode === "edit") && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">
                {mode === "create" ? "New Customer" : "Edit Customer"}
              </h2>

              <input
                placeholder="Full Name"
                className="w-full p-4 border rounded-2xl"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <input
                placeholder="Phone Number"
                className="w-full p-4 border rounded-2xl"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <input
                placeholder="Email (Optional)"
                type="email"
                className="w-full p-4 border rounded-2xl"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <input
                type="number"
                placeholder="Credit Limit"
                className="w-full p-4 border rounded-2xl"
                value={form.totalCredit}
                onChange={(e) => setForm({ ...form, totalCredit: parseFloat(e.target.value) || 0 })}
              />

              <div className="flex gap-4 pt-4">
                <button
                  onClick={mode === "create" ? createCustomer : updateCustomer}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-semibold"
                >
                  {mode === "create" ? "Create Customer" : "Save Changes"}
                </button>

                {mode === "edit" && (
                  <button
                    onClick={() => deleteCustomer(selectedCustomer.id)}
                    className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-semibold"
                  >
                    Delete Customer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}