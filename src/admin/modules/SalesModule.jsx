import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuthStore from "../../store/useAuthStore";

import {
  Receipt,
  User,
  Search,
  RefreshCw,
  ShoppingBag
} from "lucide-react";

import toast from "react-hot-toast";


export default function SalesModule() {
  const { user } = useAuthStore();


  const [sales,setSales] = useState([]);

  const [loading,setLoading] = useState(true);

  const [search,setSearch] = useState("");

  const [paymentFilter,setPaymentFilter] =
    useState("All");




  const fetchSales = async()=>{

    try{

      setLoading(true);

      const res =
        await api.get("/sales");


      setSales(res.data);


    }catch(error){

      console.error(error);

      toast.error(
        "Failed to load sales"
      );


    }finally{

      setLoading(false);

    }

  };




  useEffect(()=>{

  if(user?.activeStoreId || user?.storeId){

    fetchSales();

  }

},[
  user?.activeStoreId,
  user?.storeId
]);






  const filteredSales =
  sales.filter(sale=>{


    const searchValue =
      search.toLowerCase();



    const matchesSearch =

      sale.id
      ?.toLowerCase()
      .includes(searchValue)

      ||

      sale.user?.name
      ?.toLowerCase()
      .includes(searchValue);





    const matchesPayment =

      paymentFilter==="All"

      ||

      sale.paymentMethod===paymentFilter;



    return (
      matchesSearch &&
      matchesPayment
    );


  });








  const totalRevenue =

    sales.reduce(

      (sum,sale)=>

        sum +
        Number(
          sale.totalAmount || 0
        ),

      0

    );






return (

<div className="space-y-8">



<div className="
flex
justify-between
items-center
">


<div>

<h1 className="
text-3xl
font-bold
flex
items-center
gap-3
">

<Receipt/>

Sales & Receipts

</h1>


<p className="text-slate-500">

Total Revenue:

<span className="
font-bold
text-green-600
ml-2
">

UGX {totalRevenue.toLocaleString()}

</span>

</p>


</div>




<button

onClick={()=>{
  if(user?.activeStoreId || user?.storeId){
    fetchSales();
  }
}}

className="
bg-blue-600
text-white
px-5
py-3
rounded-2xl
flex
gap-2
items-center
"

>

<RefreshCw size={18}/>

Refresh

</button>



</div>







{/* FILTERS */}


<div className="
flex
gap-4
">


<div className="
relative
flex-1
">


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
border
rounded-2xl
"

placeholder="
Search receipt or cashier...
"

value={search}

onChange={
e=>setSearch(e.target.value)
}

/>


</div>






<select

className="
p-4
border
rounded-2xl
"

value={paymentFilter}

onChange={
e=>setPaymentFilter(e.target.value)
}

>

<option value="All">
All Payments
</option>

<option value="CASH">
Cash
</option>

<option value="MOBILE_MONEY">
Mobile Money
</option>

<option value="CARD">
Card
</option>

<option value="CREDIT">
Credit
</option>


</select>


</div>









{/* SALES LIST */}


<div className="
bg-white
rounded-3xl
shadow
p-8
">


<h2 className="
text-xl
font-bold
mb-6
">

Recent Transactions

</h2>




{

loading ?

<p className="text-center">
Loading sales...
</p>


:


filteredSales.length===0 ?


<p className="
text-center
text-slate-500
py-10
">

No sales found

</p>



:


filteredSales.map(sale=>(


<div

key={sale.id}

className="
border
rounded-3xl
p-6
mb-4
hover:bg-slate-50
"

>


<div className="
flex
justify-between
">


<div className="
flex
gap-4
items-center
">


<div className="
bg-blue-100
text-blue-600
p-4
rounded-2xl
">

<Receipt/>

</div>



<div>


<p className="
font-bold
text-xl
">

UGX {Number(
sale.totalAmount || 0
).toLocaleString()}

</p>



<p className="
text-sm
text-slate-500
flex
gap-2
items-center
">

<User size={14}/>

{sale.user?.name || "Unknown"}

•

{
new Date(
sale.createdAt
).toLocaleString()
}


</p>


</div>


</div>





<div className="text-right">


<span className="
bg-slate-100
px-4
py-2
rounded-full
text-sm
">

{
sale.paymentMethod
?.replace("_"," ")
}


</span>



<p className="
text-xs
text-slate-500
mt-3
">

{
sale.saleItems?.length || 0
}

items

</p>


</div>


</div>








{/* ITEMS */}


<div className="
mt-6
border-t
pt-4
">


<p className="
font-semibold
flex
gap-2
items-center
mb-3
">

<ShoppingBag size={18}/>

Items

</p>



{

sale.saleItems?.map(item=>(


<div

key={item.id}

className="
flex
justify-between
text-sm
"

>


<span>

{item.product?.name}

×

{item.quantity}

</span>


<span className="font-medium">

UGX {
Number(
item.subtotal
).toLocaleString()
}

</span>


</div>


))


}



</div>







<div className="
mt-5
grid
grid-cols-3
gap-4
text-sm
">


<div>

<p className="text-slate-500">
Subtotal
</p>

<p className="font-bold">

UGX {
Number(
sale.subtotal || 0
).toLocaleString()
}

</p>

</div>



<div>

<p className="text-slate-500">
VAT
</p>

<p className="font-bold">

UGX {
Number(
sale.vatAmount || 0
).toLocaleString()
}

</p>

</div>



<div>

<p className="text-slate-500">
Discount
</p>

<p className="font-bold">

UGX {
Number(
sale.discount || 0
).toLocaleString()
}

</p>

</div>


</div>




</div>


))


}



</div>



</div>

);


}