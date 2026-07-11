import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Building2, Power } from "lucide-react";

export default function StoresModule() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
    isHeadOffice: false,
  });

  const fetchStores = async () => {
    try {
      const res = await api.get("/stores");
      setStores(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stores");
    }
  };


  useEffect(() => {
    fetchStores();
  }, []);


  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post("/stores", form);

      toast.success("Store created");

      setForm({
        name: "",
        location: "",
        phone: "",
        isHeadOffice:false,
      });

      fetchStores();

    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to create store"
      );
    } finally {
      setLoading(false);
    }
  };


  const toggleStatus = async (store) => {

    try {

      await api.patch(`/stores/${store.id}/status`,{
        isActive: !store.isActive
      });


      toast.success(
        `${store.name} updated`
      );

      fetchStores();

    } catch(err){

      console.error(err);
      toast.error(
        err.response?.data?.message ||
        "Failed updating store"
      );

    }

  };


  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            Stores
          </h1>

          <p className="text-slate-500">
            Manage your company branches
          </p>
        </div>


        <Building2 size={40}
          className="text-blue-600"
        />

      </div>



      {/* CREATE STORE */}

      <div className="bg-white rounded-2xl shadow p-6">

        <h2 className="text-xl font-semibold mb-5">
          Create New Store
        </h2>


        <form
          onSubmit={handleCreate}
          className="grid md:grid-cols-4 gap-4"
        >

          <input
            placeholder="Store name"
            className="border p-3 rounded-xl"
            value={form.name}
            onChange={(e)=>
              setForm({
                ...form,
                name:e.target.value
              })
            }
            required
          />


          <input
            placeholder="Location"
            className="border p-3 rounded-xl"
            value={form.location}
            onChange={(e)=>
              setForm({
                ...form,
                location:e.target.value
              })
            }
          />


          <input
            placeholder="Phone"
            className="border p-3 rounded-xl"
            value={form.phone}
            onChange={(e)=>
              setForm({
                ...form,
                phone:e.target.value
              })
            }
          />



          <button
            disabled={loading}
            className="bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2"
          >

            <Plus size={18}/>

            {
              loading
              ? "Creating..."
              : "Create"
            }

          </button>


        </form>

      </div>





      {/* STORE LIST */}


      <div className="grid md:grid-cols-3 gap-6">


      {
        stores.map(store=>(

          <div
            key={store.id}
            className="bg-white rounded-2xl shadow p-6"
          >


            <div className="flex justify-between">

              <div>

                <h3 className="text-xl font-bold">
                  {store.name}
                </h3>


                {
                  store.isHeadOffice &&
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    Head Office
                  </span>
                }


              </div>



              <button
                onClick={()=>toggleStatus(store)}
                className={`p-2 rounded-full ${
                  store.isActive
                  ? "bg-green-100 text-green-700"
                  :
                  "bg-red-100 text-red-700"
                }`}
              >

                <Power size={18}/>

              </button>


            </div>



            <div className="mt-5 space-y-2 text-sm text-slate-600">

              <p>
                📍 {store.location || "No location"}
              </p>


              <p>
                📞 {store.phone || "No phone"}
              </p>


              <p>
                Status:
                {
                  store.isActive
                  ?
                  " Active"
                  :
                  " Disabled"
                }
              </p>


            </div>


          </div>

        ))
      }


      </div>


    </div>
  );
}