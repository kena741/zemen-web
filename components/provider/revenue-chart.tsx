"use client";

import { useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ChartColumnIcon, ChartSplineIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RevenueChartPoint } from "@/services/bookings/bookingsApi";
import { formatAmount } from "@/services/bookings/types";

type ChartType = "curve" | "column";

function formatAxisAmount(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
	return String(Math.round(value));
}

function niceYMax(maxY: number): number {
	if (maxY <= 0) return 100;
	const padded = maxY * 1.15;
	const limits = [
		10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
	];
	for (const limit of limits) {
		if (padded <= limit) return limit;
	}
	return Math.ceil(padded / 10000) * 10000;
}

export function RevenueChart({
	points,
	loading,
	year,
	currentMonthRevenue,
}: {
	points: RevenueChartPoint[];
	loading?: boolean;
	year: number;
	currentMonthRevenue: number;
}) {
	const [type, setType] = useState<ChartType>("curve");
	const yMax = useMemo(
		() => niceYMax(points.reduce((m, p) => Math.max(m, p.revenue), 0)),
		[points],
	);
	const currentMonth = new Date().getMonth();

	return (
		<section className="rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
						Monthly revenue in ETB
					</p>
					<p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
						{loading ? "…" : formatAmount(String(currentMonthRevenue))}
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						This month · {year} overview
					</p>
				</div>
				<div className="flex gap-1 rounded-lg border border-border p-0.5">
					<Button
						type="button"
						size="icon-sm"
						variant={type === "curve" ? "default" : "ghost"}
						aria-label="Curve chart"
						onClick={() => setType("curve")}
					>
						<ChartSplineIcon className="size-4" />
					</Button>
					<Button
						type="button"
						size="icon-sm"
						variant={type === "column" ? "default" : "ghost"}
						aria-label="Bar chart"
						onClick={() => setType("column")}
					>
						<ChartColumnIcon className="size-4" />
					</Button>
				</div>
			</div>

			<div
				className={cn(
					"mt-4 w-full",
					type === "column" ? "h-[280px]" : "h-[240px]",
				)}
			>
				{loading ? (
					<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
						Loading chart…
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						{type === "curve" ? (
							<AreaChart
								data={points}
								margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
							>
								<defs>
									<linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#174309" stopOpacity={0.35} />
										<stop offset="100%" stopColor="#174309" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#d7e3d2"
								/>
								<XAxis
									dataKey="month"
									tickLine={false}
									axisLine={{ stroke: "#d7e3d2" }}
									tick={{ fill: "#52634c", fontSize: 10, fontWeight: 600 }}
									interval={0}
									angle={-45}
									textAnchor="end"
									height={48}
								/>
								<YAxis
									domain={[0, yMax]}
									tickFormatter={formatAxisAmount}
									tickLine={false}
									axisLine={false}
									width={42}
									tick={{ fill: "#52634c", fontSize: 10, fontWeight: 600 }}
								/>
								<Tooltip
									formatter={(value: number) => [
										formatAmount(String(value)),
										"Revenue",
									]}
									labelFormatter={(label) => String(label)}
									contentStyle={{
										borderRadius: 8,
										borderColor: "#d7e3d2",
										fontSize: 12,
									}}
								/>
								<Area
									type="monotone"
									dataKey="revenue"
									stroke="#174309"
									strokeWidth={2}
									fill="url(#revenueFill)"
									dot={false}
									activeDot={{ r: 4, fill: "#174309" }}
								/>
							</AreaChart>
						) : (
							<BarChart
								data={points}
								margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#d7e3d2"
								/>
								<XAxis
									dataKey="month"
									tickLine={false}
									axisLine={{ stroke: "#d7e3d2" }}
									tick={{ fill: "#52634c", fontSize: 10, fontWeight: 600 }}
									interval={0}
									angle={-45}
									textAnchor="end"
									height={48}
								/>
								<YAxis
									domain={[0, yMax]}
									tickFormatter={formatAxisAmount}
									tickLine={false}
									axisLine={false}
									width={42}
									tick={{ fill: "#52634c", fontSize: 10, fontWeight: 600 }}
								/>
								<Tooltip
									formatter={(value: number) => [
										formatAmount(String(value)),
										"Revenue",
									]}
									contentStyle={{
										borderRadius: 8,
										borderColor: "#d7e3d2",
										fontSize: 12,
									}}
								/>
								<Bar
									dataKey="revenue"
									fill="#174309"
									radius={[4, 4, 0, 0]}
									maxBarSize={28}
									label={{
										position: "top",
										fontSize: 9,
										fill: "#52634c",
										formatter: (v: number) =>
											v > 0 ? formatAxisAmount(v) : "",
									}}
								/>
							</BarChart>
						)}
					</ResponsiveContainer>
				)}
			</div>

			<div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
				<span>
					Peak{" "}
					<span className="font-medium text-foreground tabular-nums">
						{formatAmount(
							String(Math.max(...points.map((p) => p.revenue), 0)),
						)}
					</span>
				</span>
				<span>
					Year total{" "}
					<span className="font-medium text-foreground tabular-nums">
						{formatAmount(
							String(points.reduce((s, p) => s + p.revenue, 0)),
						)}
					</span>
				</span>
				<span className="text-brand-ink">
					Highlight · {points[currentMonth]?.month}
				</span>
			</div>
		</section>
	);
}
