"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import {
    LineChart,
    Line,
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
    Legend,
} from "recharts";

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-stadium-dark border border-border-strong p-3 rounded-lg shadow-xl">
                <p className="text-text-secondary text-xs mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
                        {entry.name}: {entry.value.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Line Chart for views over time
interface ViewsChartProps {
    data: { date: string; views: number; users?: number }[];
    title?: string;
}

export function ViewsChart({ data, title = "Views Over Time" }: ViewsChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-stadium-elevated border border-border-strong rounded-xl p-6"
        >
            <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: "#6B7280", fontSize: 12 }}
                            axisLine={{ stroke: "#2D3748" }}
                        />
                        <YAxis
                            tick={{ fill: "#6B7280", fontSize: 12 }}
                            axisLine={{ stroke: "#2D3748" }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="views"
                            stroke="#22C55E"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorViews)"
                            name="Views"
                        />
                        {data[0]?.users !== undefined && (
                            <Area
                                type="monotone"
                                dataKey="users"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                                name="Users"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

// Bar Chart for top content
interface TopContentChartProps {
    data: { name: string; views: number }[];
    title?: string;
}

const BAR_COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#A855F7", "#06B6D4"];

export function TopContentChart({ data, title = "Top Content" }: TopContentChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-stadium-elevated border border-border-strong rounded-xl p-6"
        >
            <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                        <XAxis
                            type="number"
                            tick={{ fill: "#6B7280", fontSize: 12 }}
                            axisLine={{ stroke: "#2D3748" }}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 600 }}
                            axisLine={{ stroke: "#2D3748" }}
                            width={80}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="views"
                            radius={[0, 6, 6, 0]}
                            name="Views"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

// Pie Chart for subscription stats
interface SubscriptionChartProps {
    data: { name: string; value: number; color: string }[];
    title?: string;
}

export function SubscriptionChart({ data, title = "Subscriptions" }: SubscriptionChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const hasData = total > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-stadium-elevated border border-border-strong rounded-xl p-6"
        >
            <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
            {hasData ? (
                <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, value }) => `${value}`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                formatter={(value, entry: any) => {
                                    const item = data.find(d => d.name === value);
                                    return (
                                        <span className="text-text-secondary text-sm">
                                            {value}: <strong className="text-white">{item?.value || 0}</strong>
                                        </span>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-text-muted">
                    <Users size={40} className="mb-2 opacity-50" />
                    <p className="text-sm">No subscription data yet</p>
                </div>
            )}
        </motion.div>
    );
}

// Simple sparkline component for inline stats
interface SparklineProps {
    data: number[];
    color?: string;
    height?: number;
}

export function Sparkline({ data, color = "#22C55E", height = 40 }: SparklineProps) {
    const chartData = data.map((value, index) => ({ value, index }));

    return (
        <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
