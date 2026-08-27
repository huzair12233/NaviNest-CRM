"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { inr } from "@/lib/utils";

const CAT = ["#0f766e", "#2563eb", "#d4a537", "#7c3aed", "#db2777", "#ea580c", "#0891b2", "#65a30d"];

const axis = { stroke: "#8290a8", fontSize: 11 };
const tooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid #d4d9e2",
    fontSize: 12,
    boxShadow: "0 8px 30px rgb(20 24 34 / 0.12)",
  },
};

export function LeadTrendChart({ data }: { data: { label: string; leads: number; won: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
        <XAxis dataKey="label" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey="leads" stroke="#0f766e" strokeWidth={2} fill="url(#gLeads)" name="New leads" />
        <Area type="monotone" dataKey="won" stroke="#d4a537" strokeWidth={2} fill="none" name="Converted" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({
  data,
  color = "#0f766e",
}: {
  data: { name: string; value: number }[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" horizontal={false} />
        <XAxis type="number" {...axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" {...axis} width={110} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "#f6f7f9" }} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={16}>
          <LabelList dataKey="value" position="right" fontSize={11} fill="#61708b" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={CAT[i % CAT.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-ink-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CAT[i % CAT.length] }} />
              {d.name}
            </span>
            <span className="font-medium text-ink-900">
              {d.value}
              <span className="ml-1 text-xs text-ink-400">
                {total ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PipelineFunnel({ data }: { data: { name: string; value: number; amount: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-right text-xs text-ink-500">{d.name}</span>
          <div className="flex-1">
            <div
              className="flex h-7 items-center justify-end rounded-md px-2 text-xs font-medium text-white transition-all"
              style={{
                width: `${Math.max(8, (d.value / max) * 100)}%`,
                backgroundColor: CAT[i % CAT.length],
              }}
            >
              {d.value}
            </div>
          </div>
          <span className="w-16 shrink-0 text-xs text-ink-400">{d.amount ? inr(d.amount) : ""}</span>
        </div>
      ))}
    </div>
  );
}

export function MiniBar({ data, color = "#0f766e" }: { data: { name: string; value: number }[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
        <XAxis dataKey="name" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "#f6f7f9" }} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
