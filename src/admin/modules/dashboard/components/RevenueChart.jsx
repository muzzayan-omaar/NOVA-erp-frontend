import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { BarChart3 } from "lucide-react";

export default function RevenueChart({ salesTrend = [] }) {
  return (
    <div className="bg-white rounded-3xl shadow p-8">

      <h2 className="font-bold text-xl mb-6 flex items-center gap-3">
        <BarChart3 className="text-blue-600" />
        Revenue Trend
      </h2>

      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={salesTrend}>

          <defs>
            <linearGradient
              id="revenueGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="#2563eb"
                stopOpacity={0.45}
              />

              <stop
                offset="95%"
                stopColor="#2563eb"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis dataKey="date" />

          <YAxis />

          <Tooltip
            formatter={(value) => [
              `UGX ${Number(value).toLocaleString()}`,
              "Revenue",
            ]}
          />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#2563eb"
            strokeWidth={3}
            fill="url(#revenueGradient)"
          />

        </AreaChart>
      </ResponsiveContainer>

    </div>
  );
}