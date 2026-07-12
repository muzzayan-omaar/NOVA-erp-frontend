import { useEffect, useState } from "react";
import api from "../../services/api";
import {
  Package,
  AlertTriangle,
  ArrowUpDown,
  Search,
  Plus,
  X
} from "lucide-react";

import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";


export default function InventoryModule() {
  const { user } = useAuthStore();

  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showAdjust, setShowAdjust] = useState(false);


  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");


  const [adjustment, setAdjustment] = useState({
    productId:"",
    quantity:"",
    type:"IN",
    reason:""
  });



  const [stats,setStats] = useState({
    totalProducts:0,
    totalStock:0,
    lowStockCount:0,
    outOfStockCount:0,
    inventoryValue:0
  });



  const fetchInventory = async()=>{

    try{

      const [movementRes,productRes] = await Promise.all([
        api.get("/inventory/movements"),
        api.get("/products")
      ]);


      setMovements(movementRes.data);
      setProducts(productRes.data);



      const totalStock = productRes.data.reduce(
        (sum,p)=>sum+(p.stockQuantity || 0),
        0
      );


      const lowStock = productRes.data.filter(
        p=>(p.stockQuantity || 0)<=10
      );


      const outStock = productRes.data.filter(
        p=>(p.stockQuantity || 0)===0
      );


      const value = productRes.data.reduce(
        (sum,p)=>
          sum+
          ((p.stockQuantity || 0)*(p.buyingPrice || 0)),
        0
      );



      setStats({
        totalProducts:productRes.data.length,
        totalStock,
        lowStockCount:lowStock.length,
        outOfStockCount:outStock.length,
        inventoryValue:value
      });



    }catch(error){

      console.error(error);
      toast.error("Failed to load inventory");

    }finally{

      setLoading(false);

    }

  };



  useEffect(() => {
  if (user?.activeStoreId || user?.storeId) {
    fetchInventory();
  }
}, [user?.activeStoreId, user?.storeId]);




  const adjustStock = async()=>{

    try{

      if(
        !adjustment.productId ||
        !adjustment.quantity
      ){
        toast.error("Product and quantity required");
        return;
      }



      await api.post(
        "/inventory/adjust",
        adjustment
      );


      toast.success("Stock updated");


      setShowAdjust(false);


      setAdjustment({
        productId:"",
        quantity:"",
        type:"IN",
        reason:""
      });


      fetchInventory();



    }catch(error){

      console.error(error);

      toast.error(
        error.response?.data?.message ||
        "Stock adjustment failed"
      );

    }

  };





  const filteredMovements =
    movements.filter(m=>{

      const name =
        m.product?.name?.toLowerCase() || "";


      return (
        name.includes(
          searchTerm.toLowerCase()
        )
        &&
        (
          filterType==="All" ||
          m.type===filterType
        )
      );

    });




  return (

    <div className="space-y-8">


      <div className="flex justify-between items-center">

        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package/>
          Inventory Management
        </h1>


        <button
          onClick={()=>setShowAdjust(true)}
          className="
          bg-blue-600
          text-white
          px-6
          py-3
          rounded-2xl
          flex
          gap-2
          items-center
          "
        >
          <Plus size={20}/>
          Adjust Stock
        </button>

      </div>





      {/* STATS */}

      <div className="
      grid
      grid-cols-2
      md:grid-cols-5
      gap-5
      ">


        <Stat
          title="Products"
          value={stats.totalProducts}
        />


        <Stat
          title="Stock Units"
          value={stats.totalStock}
        />


        <Stat
          title="Low Stock"
          value={stats.lowStockCount}
        />


        <Stat
          title="Out Stock"
          value={stats.outOfStockCount}
        />


        <Stat
          title="Value"
          value={`UGX ${stats.inventoryValue.toLocaleString()}`}
        />


      </div>





      {/* SEARCH */}

      <div className="flex gap-4">


        <div className="relative flex-1">

          <Search
            className="
            absolute
            left-4
            top-4
            text-slate-400
            "
          />


          <input
            className="
            w-full
            p-4
            pl-12
            rounded-2xl
            border
            "
            placeholder="Search product..."
            value={searchTerm}
            onChange={
              e=>setSearchTerm(e.target.value)
            }
          />

        </div>



        <select
          className="p-4 border rounded-2xl"
          value={filterType}
          onChange={
            e=>setFilterType(e.target.value)
          }
        >

          <option value="All">
            All
          </option>

          <option value="IN">
            Stock In
          </option>

          <option value="OUT">
            Stock Out
          </option>

          <option value="SALE">
            Sales
          </option>

          <option value="ADJUSTMENT">
            Adjustment
          </option>

        </select>


      </div>





      {/* MOVEMENTS */}

      <div className="
      bg-white
      rounded-3xl
      shadow
      p-8
      ">


        <h2 className="
        text-xl
        font-bold
        flex
        gap-3
        mb-6
        ">
          <ArrowUpDown/>
          Movement History
        </h2>




        {
        loading ?

        <p>Loading...</p>

        :

        filteredMovements.length===0 ?

        <p className="text-center text-slate-500">
          No movements found
        </p>


        :

        filteredMovements.map(m=>(

          <div
          key={m.id}
          className="
          flex
          justify-between
          border
          rounded-2xl
          p-5
          mb-3
          "
          >

            <div>

              <p className="font-bold">
                {m.product?.name}
              </p>

              <p className="text-sm text-slate-500">
                {m.reason || "No reason"}
              </p>

            </div>


            <div className="text-right">

              <p className="font-bold">
                {m.type==="IN" ? "+" : "-"}
                {m.quantity}
              </p>


              <p className="text-xs text-slate-500">
                {new Date(
                  m.createdAt
                ).toLocaleString()}
              </p>

            </div>


          </div>


        ))

        }


      </div>





      {/* ADJUST MODAL */}

      {
      showAdjust &&

      <div className="
      fixed
      inset-0
      bg-black/40
      flex
      items-center
      justify-center
      ">


        <div className="
        bg-white
        p-8
        rounded-3xl
        w-[450px]
        space-y-5
        ">


          <div className="flex justify-between">

            <h2 className="text-xl font-bold">
              Adjust Stock
            </h2>


            <button
            onClick={()=>setShowAdjust(false)}
            >
              <X/>
            </button>

          </div>




          <select
          className="w-full p-4 border rounded-xl"
          value={adjustment.productId}
          onChange={
            e=>setAdjustment({
              ...adjustment,
              productId:e.target.value
            })
          }
          >

            <option value="">
              Select Product
            </option>


            {
            products.map(p=>(

              <option
              key={p.id}
              value={p.id}
              >
                {p.name}
              </option>

            ))
            }


          </select>





          <input
          className="w-full p-4 border rounded-xl"
          type="number"
          placeholder="Quantity"
          value={adjustment.quantity}
          onChange={
            e=>setAdjustment({
              ...adjustment,
              quantity:e.target.value
            })
          }
          />




          <select
          className="w-full p-4 border rounded-xl"
          value={adjustment.type}
          onChange={
            e=>setAdjustment({
              ...adjustment,
              type:e.target.value
            })
          }
          >

            <option value="IN">
              Stock In
            </option>

            <option value="OUT">
              Stock Out
            </option>

            <option value="ADJUSTMENT">
              Set Quantity
            </option>

          </select>




          <input
          className="w-full p-4 border rounded-xl"
          placeholder="Reason"
          value={adjustment.reason}
          onChange={
            e=>setAdjustment({
              ...adjustment,
              reason:e.target.value
            })
          }
          />



          <button
          onClick={adjustStock}
          className="
          w-full
          bg-blue-600
          text-white
          py-4
          rounded-xl
          "
          >
            Save Adjustment
          </button>


        </div>


      </div>

      }


    </div>

  );
}




function Stat({title,value}){

return (

<div className="
bg-white
p-6
rounded-3xl
shadow
">

<p className="text-slate-500 text-sm">
{title}
</p>

<p className="text-3xl font-bold">
{value}
</p>

</div>

)

}