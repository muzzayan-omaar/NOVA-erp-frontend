import { useEffect, useState } from "react";
import api from "../../services/api";

import {
  ShoppingCart,
  AlertTriangle,
  Users,
  DollarSign,
  BarChart3,
  RefreshCcw
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

import toast from "react-hot-toast";



export default function DashboardModule() {


  const [data,setData] = useState(null);

  const [advancedData,setAdvancedData] = useState(null);

  const [stores,setStores] = useState([]);

  const [selectedStore,setSelectedStore] =
    useState("ALL");


  const [loading,setLoading] =
    useState(true);


  const [refreshing,setRefreshing] =
    useState(false);



  // =========================
  // FETCH STORES
  // =========================

  const fetchStores = async()=>{

    try{

      const res =
        await api.get("/stores");


      setStores(res.data);


    }catch(error){

      console.error(error);

      toast.error(
        "Failed loading branches"
      );

    }

  };




  // =========================
  // FETCH DASHBOARD
  // =========================

  const fetchDashboard = async()=>{

    try{


      setLoading(true);


      const [
        basicRes,
        advancedRes
      ] = await Promise.all([


        api.get(
          `/analytics?storeId=${selectedStore}`
        ),



        api.get(
          `/analytics/advanced?period=30&storeId=${selectedStore}`
        )


      ]);



      setData(
        basicRes.data
      );


      setAdvancedData(
        advancedRes.data
      );



    }catch(error){

      console.error(error);

      toast.error(
        "Failed loading dashboard"
      );


    }finally{


      setLoading(false);

      setRefreshing(false);


    }


  };




  useEffect(()=>{

    fetchStores();

  },[]);



  useEffect(()=>{

    fetchDashboard();

  },[selectedStore]);





  const refreshDashboard = ()=>{

    setRefreshing(true);

    fetchDashboard();

  };






  // =========================
  // EXPORT EXCEL
  // =========================

  const exportToExcel = ()=>{


    const exportData=[

      [
        "Date",
        "Revenue",
        "Transactions"
      ],


      ...(advancedData?.salesTrend || [])
      .map(item=>[

        item.date,

        item.revenue,

        item.count

      ])

    ];



    const worksheet =
      XLSX.utils.aoa_to_sheet(
        exportData
      );


    const workbook =
      XLSX.utils.book_new();



    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Sales Trend"
    );



    XLSX.writeFile(

      workbook,

      `Nova_Report_${new Date()
      .toISOString()
      .slice(0,10)}.xlsx`

    );


    toast.success(
      "Excel exported"
    );

  };







  // =========================
  // EXPORT PDF
  // =========================

  const exportToPDF = ()=>{


    const doc =
      new jsPDF();



    doc.text(
      "Nova ERP Sales Report",
      14,
      20
    );



    doc.autoTable({

      head:[

        [
          "Date",
          "Revenue",
          "Transactions"
        ]

      ],


      body:

      (advancedData?.salesTrend || [])
      .map(item=>[

        item.date,

        item.revenue
        .toLocaleString(),

        item.count

      ])

    });



    doc.save(

      `Nova_Report_${new Date()
      .toISOString()
      .slice(0,10)}.pdf`

    );



    toast.success(
      "PDF exported"
    );


  };







  if(loading || !data){

    return (

      <div className="
      h-full
      flex
      items-center
      justify-center
      text-slate-500
      ">

        Loading business intelligence...

      </div>

    );

  }







return (

<div className="space-y-8">





{/* HEADER */}

<div className="
flex
justify-between
items-end
">


<div>

<h1 className="
text-4xl
font-bold
">

Owner Intelligence

</h1>


<p className="text-slate-500">

Real-time business performance

</p>


</div>




<div className="
flex
gap-3
items-center
">



<select

value={selectedStore}

onChange={
e=>setSelectedStore(e.target.value)
}

className="
border
rounded-2xl
px-5
py-3
"

>


<option value="ALL">

All Branches

</option>



{
stores.map(store=>(

<option

key={store.id}

value={store.id}

>

{store.name}

</option>


))

}



</select>






<button

onClick={refreshDashboard}

className="
bg-slate-900
text-white
px-5
py-3
rounded-2xl
flex
gap-2
items-center
"

>


<RefreshCcw

size={18}

className={
refreshing
?
"animate-spin"
:
""
}

/>


Refresh


</button>





<button

onClick={exportToExcel}

className="
bg-green-600
text-white
px-5
py-3
rounded-2xl
"

>

📊 Excel

</button>




<button

onClick={exportToPDF}

className="
bg-red-600
text-white
px-5
py-3
rounded-2xl
"

>

📕 PDF

</button>




</div>


</div>








{/* KPI */}

<div className="
grid
grid-cols-1
md:grid-cols-2
lg:grid-cols-4
gap-6
">





<Kpi

icon={DollarSign}

title="Revenue"

value={`UGX ${
data.totalRevenue
?.toLocaleString() || 0
}`}

/>




<Kpi

icon={ShoppingCart}

title="Transactions"

value={
data.totalTransactions || 0
}

/>




<Kpi

icon={AlertTriangle}

title="Low Stock"

value={
data.lowStock?.length || 0
}

/>




<Kpi

icon={Users}

title="Cashiers"

value={
advancedData
?.cashierPerformance
?.length || 0
}

/>



</div>








{/* CHARTS */}


<div className="
grid
lg:grid-cols-2
gap-6
">



<div className="
bg-white
rounded-3xl
shadow
p-8
">


<h2 className="
font-bold
text-xl
mb-6
flex
gap-3
items-center
">

<BarChart3/>

Sales Trend

</h2>



<ResponsiveContainer
width="100%"
height={320}
>


<BarChart

data={
advancedData?.salesTrend || []
}

>


<CartesianGrid
strokeDasharray="3 3"
/>


<XAxis dataKey="date"/>


<YAxis/>


<Tooltip/>


<Bar

dataKey="revenue"

fill="#3b82f6"

/>


</BarChart>


</ResponsiveContainer>



</div>







<div className="
bg-white
rounded-3xl
shadow
p-8
">


<h2 className="
font-bold
text-xl
mb-6
">

Top Cashiers

</h2>



<div className="space-y-4">


{
advancedData
?.cashierPerformance
?.slice(0,5)
.map((cashier,index)=>(


<div

key={index}

className="
flex
justify-between
bg-slate-50
p-4
rounded-2xl
"

>


<div>


<p className="font-semibold">

{cashier.name }

</p> 


<p className="text-sm text-slate-500">

{
 cashier.transactionCount
}

 transactions

</p>


</div>



<p className="font-bold">

UGX {
cashier.totalSales
.toLocaleString()
}

</p>



</div>


))


}



</div>


</div>



</div>







{/* LOW STOCK */}



{
data.lowStock?.length > 0 &&


<div className="
bg-orange-50
border
border-orange-200
rounded-3xl
p-8
">


<h2 className="
font-bold
text-xl
text-orange-700
mb-5
">

Low Stock Alerts

</h2>



<div className="
grid
md:grid-cols-4
gap-4
">


{
data.lowStock.map(product=>(


<div

key={product.id}

className="
bg-white
p-5
rounded-2xl
"

>


<p className="font-semibold">

{product.name}

</p>


<p className="
text-3xl
font-bold
text-red-600
">

{product.stockQuantity}

</p>


<p className="text-sm text-slate-500">

remaining

</p>



</div>


))


}


</div>



</div>


}



</div>

);


}








function Kpi({
icon:Icon,
title,
value
}){


return (

<div className="
bg-white
p-8
rounded-3xl
shadow
">


<Icon
size={40}
className="mb-4 text-blue-600"
/>


<p className="text-slate-500">

{title}

</p>


<p className="
text-4xl
font-bold
mt-2
">

{value}

</p>


</div>

);


}