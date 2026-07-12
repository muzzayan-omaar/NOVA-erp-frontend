import { useEffect, useState } from "react";
import api from "../../services/api";
import {
  CreditCard,
  Banknote,
  Wallet,
  TrendingUp,
  RefreshCcw,
  Receipt
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";


export default function PaymentsModule() {
  const { user } = useAuthStore();
  const [paymentData, setPaymentData] = useState({
    cash:0,
    mobile:0,
    card:0,
    total:0,
    transactionCount:0
  });

  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);


  const fetchPaymentSummary = async () => {

    try {

      const res = await api.get("/payments/summary");

      setPaymentData(res.data);

    } catch(error){

      console.error(error);

      toast.error(
        error.response?.data?.message ||
        "Failed to load payment summary"
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  useEffect(()=>{

  if(user?.activeStoreId || user?.storeId){

    fetchPaymentSummary();

  }

},[
  user?.activeStoreId,
  user?.storeId
]);



  const handleRefresh = ()=>{

  if(user?.activeStoreId || user?.storeId){

    setRefreshing(true);

    fetchPaymentSummary();

  }

};;



  const Card = ({
    title,
    amount,
    icon:Icon,
    color
  })=>(
    <div className="bg-white p-8 rounded-3xl shadow hover:shadow-lg transition">

      <div
        className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}
      >
        <Icon 
          size={30}
          className="text-white"
        />
      </div>


      <p className="text-slate-500 text-sm">
        {title}
      </p>


      <p className="text-4xl font-bold mt-2">
        UGX {amount.toLocaleString()}
      </p>


    </div>
  );



  if(loading){

    return (

      <div className="flex items-center justify-center h-64">

        <p className="text-slate-500">
          Loading payments...
        </p>

      </div>

    );

  }



  return (

    <div className="space-y-8">


      {/* Header */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold">
            Payments Overview
          </h1>


          <p className="text-slate-500">
            Today's payment performance
          </p>

        </div>



        <button
          onClick={handleRefresh}
          className="
          flex items-center gap-2
          bg-slate-900
          text-white
          px-5
          py-3
          rounded-xl
          hover:bg-slate-700
          "
        >

          <RefreshCcw
            size={18}
            className={
              refreshing
              ? "animate-spin"
              : ""
            }
          />

          Refresh

        </button>


      </div>





      {/* Summary Cards */}

      <div className="
      grid 
      grid-cols-1 
      md:grid-cols-2 
      lg:grid-cols-5
      gap-6
      ">


        <Card
          title="Cash Payments"
          amount={paymentData.cash || 0}
          icon={Banknote}
          color="bg-green-600"
        />


        <Card
          title="Mobile Money"
          amount={paymentData.mobile || 0}
          icon={Wallet}
          color="bg-blue-600"
        />


        <Card
          title="Card Payments"
          amount={paymentData.card || 0}
          icon={CreditCard}
          color="bg-purple-600"
        />


        <Card
          title="Total Revenue"
          amount={paymentData.total || 0}
          icon={TrendingUp}
          color="bg-slate-900"
        />


        <Card
          title="Transactions"
          amount={paymentData.transactionCount || 0}
          icon={Receipt}
          color="bg-orange-600"
        />


      </div>





      {/* Analytics Placeholder */}

      <div className="
      bg-white
      rounded-3xl
      shadow
      p-8
      ">


        <h2 className="text-xl font-bold mb-3">

          Payment Analytics

        </h2>


        <p className="text-slate-500">

          Advanced charts, payment trends,
          cashier performance and revenue reports
          will appear here in the analytics phase.

        </p>


      </div>



    </div>

  );

}