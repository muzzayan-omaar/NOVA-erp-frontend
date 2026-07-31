import { Building2 } from "lucide-react";

export default function BranchPerformanceCard({
  branches = [],
}) {
  return (
    <div className="bg-white rounded-3xl shadow p-8">

      <h2 className="font-bold text-xl mb-6 flex items-center gap-3">
        <Building2 className="text-indigo-600" />
        Branch Performance
      </h2>

      {branches.length === 0 ? (

        <div className="text-slate-500 py-10 text-center">
          No branch data available.
        </div>

      ) : (

        <div className="space-y-4">

          {branches.map((branch) => (

            <div
              key={branch.storeId}
              className="border rounded-2xl p-4"
            >

              <div className="flex justify-between items-center">

                <div>

                  <h3 className="font-semibold">
                    {branch.storeName}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {branch.transactions} transactions
                  </p>

                </div>

                <div className="text-right">

                  <p className="font-bold text-lg">
                    UGX {branch.revenue.toLocaleString()}
                  </p>

                  <p className="text-sm text-emerald-600">
                    Profit: UGX {branch.profit.toLocaleString()}
                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}