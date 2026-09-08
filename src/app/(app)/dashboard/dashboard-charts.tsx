"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type MonthlyPoint = { label: string; value: number };

const AXIS_STYLE = { fontSize: 12, fill: "#64748b" };

export function CashBarChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={AXIS_STYLE} />
        <YAxis tick={AXIS_STYLE} />
        <Tooltip formatter={(value) => `Rp${Number(value).toLocaleString("id-ID")}`} />
        <Bar dataKey="value" fill="var(--brand-blue)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GrowthLineChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={AXIS_STYLE} />
        <YAxis tick={AXIS_STYLE} allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="var(--brand-blue)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AttendanceBarChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={AXIS_STYLE} />
        <YAxis tick={AXIS_STYLE} unit="%" />
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="value" fill="var(--brand-green)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
