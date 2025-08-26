"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";



import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  Cell,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

type HiringStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

const statuses: HiringStatus[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
];

// Assign colors for each status (feel free to customize)
const statusColors: Record<HiringStatus, string> = {
  applied: "#3b82f6", // blue
  screening: "#f59e0b", // amber
  interview: "#10b981", // green
  offer: "#8b5cf6", // purple
  hired: "#14b8a6", // teal
  rejected: "#ef4444", // red
};

const chartConfig = {
  hiringStatus: {
    label: "Resume Hiring Status",
  },
};

export function HiringStatusChart() {
  const [data, setData] = useState<
    { status: HiringStatus; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHiringStatusCounts() {
      setLoading(true);
      try {
        const colRef = collection(db, "resumes"); // your resumes collection
        const snapshot = await getDocs(colRef);
        
        const counts: Record<HiringStatus, number> = {
          applied: 0,
          screening: 0,
          interview: 0,
          offer: 0,
          hired: 0,
          rejected: 0,
        };

        snapshot.forEach((doc) => {
          const data = doc.data();
          const status = data.hiringstatus?.toLowerCase();

          if (statuses.includes(status)) {
            counts[status as HiringStatus]++;
          }
        });

        const chartArray = statuses.map((status) => ({
          status,
          count: counts[status],
        }));

        setData(chartArray);
      } catch (error) {
        console.error("Error fetching hiring status counts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHiringStatusCounts();
      fetchHiringStatusCounts();
  }, []);

  if (loading) return <p>Loading hiring status chart...</p>;

  return (
    <Card className="py-0 mb-3">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle className="pt-2">Resume Hiring Status</CardTitle>
          <CardDescription>Count of resumes by hiring status</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 20, right: 40, bottom: 20, left: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              dataKey="status"
              type="category"
              tick={{ fontWeight: "bold" }}
            />
            <Tooltip
              formatter={(value: number) => [value, "Count"]}
              cursor={{ fill: "rgba(0,0,0,0.1)" }}
            />
            <Bar
              dataKey="count"
              isAnimationActive={false}
              label={{ position: "right" }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={statusColors[entry.status]}
                />
              ))}
              <LabelList dataKey="count" position="right" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
