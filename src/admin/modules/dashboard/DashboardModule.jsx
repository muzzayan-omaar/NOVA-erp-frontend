import { useEffect, useState } from "react";
import {
    useNavigate
} from "react-router-dom";
import api from "../../../services/api";

import {
  ShoppingCart,
  AlertTriangle,
  Users,
  DollarSign,
  BarChart3,
  RefreshCcw,
  Bell,
  ThumbsUp,
  ExternalLink,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

import toast from "react-hot-toast";
import socket from "../../../services/socket";

import useAuthStore from "../../../store/useAuthStore";
import RevenueChart from "./components/RevenueChart";
import BranchPerformanceCard from "./components/BranchPerformanceCard";
import CashierLeaderboard from "./components/CashierLeaderboard";
import LowStockAlert from "./components/LowStockAlert";





export default function DashboardModule() {

  const { user } = useAuthStore();


  const [data,setData] = useState(null);

  const [advancedData,setAdvancedData] = useState(null);

  const [stores,setStores] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedStore,setSelectedStore] =
    useState("ALL");


  const [loading,setLoading] =
    useState(true);


  const [refreshing,setRefreshing] =
    useState(false);

  useEffect(()=>{


socket.emit(
"joinRooms",
{

companyId:user.companyId,

storeId:
user.activeStoreId || user.storeId,

userId:user.id

}
);



socket.on(
"notification:new",
(notification)=>{


setNotifications(prev=>[

notification,

...prev

]);


toast(
notification.title
);


}
);



return ()=>{


socket.off(
"notification:new"
);


};


},[user]);

 

  // =========================
  // FETCH STORES
  // =========================

  const fetchStores = async()=>{

  try{

    const res = await api.get("/stores");

    setStores(res.data);

  }catch(error){

    console.error(error);

  }

};




  // =========================
  // FETCH DASHBOARD
  // =========================

  const fetchDashboard = async()=>{

    try{


      setLoading(true);


      const [basicRes, advancedRes] = await Promise.all([

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


const notificationActions = {


    LOW_STOCK:{
        label:"View Inventory",
        path:"/admin/products"
    },


    INVENTORY:{
        label:"View Inventory",
        path:"/admin/inventory"
    },


    SALE:{
        label:"View Sales",
        path:"/admin/sales"
    },


    TARGET:{
        label:"View Analytics",
        path:"/admin/analytics"
    },


    FAILED_LOGIN:{
        label:"Review Security",
        path:"/admin/settings/security"
    },


    LOGIN:{
        label:"Okay",
        acknowledge:true
    },


    LOGOUT:{
        label:"Okay",
        acknowledge:true
    },


    SYSTEM:{
        label:"Okay",
        acknowledge:true
    }


};

const calcChange = (current, previous) => {
  if (previous == null || current == null) return null;
  if (previous === 0) {
    if (current === 0) return null;
    return { value: 100, isPositive: current > 0 };
  }
  const raw = ((current - previous) / Math.abs(previous)) * 100;
  return {
    value: Math.round(Math.abs(raw) * 10) / 10,
    isPositive: raw >= 0,
  };
};

// Build trend stats from salesTrend (expects [{ date, revenue, count }])
const trend = [...(advancedData?.salesTrend || [])].sort((a, b) =>
  a.date.localeCompare(b.date)
);

const last = trend[trend.length - 1];
const prev = trend[trend.length - 2];

const sumRange = (arr, key) =>
  arr.reduce((s, row) => s + (Number(row[key]) || 0), 0);

const last7 = trend.slice(-7);
const prev7 = trend.slice(-14, -7);

const revenueChange = calcChange(sumRange(last7, "revenue"), sumRange(prev7, "revenue"));
const transactionsChange = calcChange(sumRange(last7, "count"), sumRange(prev7, "count"));

const todayRevenueChange = calcChange(last?.revenue, prev?.revenue);
const todaySalesChange = calcChange(last?.count, prev?.count);

const avgLast7 =
  sumRange(last7, "count") > 0
    ? sumRange(last7, "revenue") / sumRange(last7, "count")
    : 0;
const avgPrev7 =
  sumRange(prev7, "count") > 0
    ? sumRange(prev7, "revenue") / sumRange(prev7, "count")
    : 0;
const avgSaleChange = calcChange(avgLast7, avgPrev7);

// Prefer API-provided changes if your backend already sends them
const changes = {
  revenue: data.revenueChange ?? revenueChange,
  profit: data.profitChange ?? null,
  transactions: data.transactionsChange ?? transactionsChange,
  todaySales: data.todaySalesChange ?? todaySalesChange,
  todayRevenue: data.todayRevenueChange ?? todayRevenueChange,
  averageSale: data.averageSaleChange ?? avgSaleChange,
  customerCredit: data.customerCreditChange ?? null,
  // decrease in debt is good → flip sign if you only have raw %
  supplierDebt: data.supplierDebtChange ?? null,
};


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



{
user?.role === "OWNER" && (

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

)
}





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

{/* KPI - Horizontal & Compact */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <Kpi
    icon={DollarSign}
    title="Revenue"
    value={`UGX ${data.totalRevenue.toLocaleString()}`}
    change={changes.revenue}
  />
  <Kpi
    icon={DollarSign}
    title="Profit"
    value={`UGX ${data.totalProfit.toLocaleString()}`}
    change={changes.profit}
  />
  <Kpi
    icon={ShoppingCart}
    title="Transactions"
    value={data.totalTransactions}
    change={changes.transactions}
  />
  <Kpi
    icon={ShoppingCart}
    title="Today's Sales"
    value={data.todayTransactions}
    change={changes.todaySales}
  />
  <Kpi
    icon={DollarSign}
    title="Today's Revenue"
    value={`UGX ${data.todayRevenue.toLocaleString()}`}
    change={changes.todayRevenue}
  />
  <Kpi
    icon={BarChart3}
    title="Average Sale"
    value={`UGX ${Math.round(data.averageTransaction).toLocaleString()}`}
    change={changes.averageSale}
  />
  <Kpi
    icon={Users}
    title="Customer Credit"
    value={`UGX ${data.customerCredit.toLocaleString()}`}
    change={changes.customerCredit}
  />
  <Kpi
    icon={AlertTriangle}
    title="Supplier Debt"
    value={`UGX ${data.supplierDebt.toLocaleString()}`}
    change={changes.supplierDebt}
  />
</div>







{/* CHARTS */}


<div className="
grid
lg:grid-cols-2
gap-6
">



<RevenueChart
    salesTrend={advancedData?.salesTrend}
/>






<BranchPerformanceCard
    branches={advancedData?.branchPerformance || []}
/>


</div>



<CashierLeaderboard
    cashiers={advancedData?.cashierPerformance || []}
/>



{/* LOW STOCK */}

<LowStockAlert
    products={data.lowStock}
/>



</div>

);


}








function Kpi({ title, value, change }) {
    return (
        <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 hover:shadow transition-all flex items-center justify-between">
            
            <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500 font-medium whitespace-nowrap">{title}</p>
                <p className="text-xl font-bold text-slate-900 whitespace-nowrap">
                    {value}
                </p>
            </div>

            {/* Trend */}
            {change && (
                <div className={`flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-2xl whitespace-nowrap ${
                    change.isPositive 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                }`}>
                    {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
                </div>
            )}
        </div>
    );
}
