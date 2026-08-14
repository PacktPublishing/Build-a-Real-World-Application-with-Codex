"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/formatters";
import styles from "./Dashboard.module.css";

function formatAxisCurrency(cents) {
  if (cents >= 100000) {
    return `$${Math.round(cents / 100000)}k`;
  }

  return formatCurrency(cents).replace(".00", "");
}

export default function RevenueChart({ data }) {
  return (
    <div className={styles.chartFrame}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={formatAxisCurrency}
            width={64}
          />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            formatter={(value) => [formatCurrency(value), "Revenue"]}
            labelStyle={{ color: "#172033", fontWeight: 700 }}
            contentStyle={{
              border: "1px solid #d9e1ec",
              borderRadius: 8,
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
            }}
          />
          <Bar dataKey="totalCents" fill="#2563eb" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
