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
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { BarChart, Bar, CartesianGrid, XAxis } from "recharts";

type ResumeData = {
  uploadedAt: { seconds: number; nanoseconds: number } | string;
  // add other fields if needed
};

// Chart config, simplified to just one dataset — total uploads
const chartConfig = {
  views: {
    label: "Resume Uploads",
  },
};

export function ResumeUploadChart() {
  const [chartData, setChartData] = useState<
    { date: string; uploads: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeChart] = React.useState<keyof typeof chartConfig>("views");

  useEffect(() => {
    async function fetchResumes() {
      setLoading(true);
      try {
        const colRef = collection(db, "resumes"); // your resumes metadata collection
        const snapshot = await getDocs(colRef);
        const uploadsByDate: Record<string, number> = {};

        snapshot.forEach((doc) => {
          const data = doc.data() as ResumeData;

          // Assuming uploadedAt is a Firestore Timestamp or ISO string
          let dateStr = "";

          if (typeof data.uploadedAt === "string") {
            dateStr = new Date(data.uploadedAt).toISOString().slice(0, 10);
          } else if ("seconds" in data.uploadedAt) {
            // Firestore Timestamp object
            dateStr = new Date(data.uploadedAt.seconds * 1000)
              .toISOString()
              .slice(0, 10);
          }

          if (dateStr) {
            uploadsByDate[dateStr] = (uploadsByDate[dateStr] || 0) + 1;
          }
        });

        // Convert to array sorted by date ascending
        const chartArray = Object.entries(uploadsByDate)
          .map(([date, uploads]) => ({ date, uploads }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setChartData(chartArray);
      } catch (error) {
        console.error("Error fetching resumes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchResumes();
  }, []);

  if (loading) return <p>Loading chart...</p>;

  return (
    <Card className="py-0 mb-3 mt-3">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle className="mt-3">Resume Uploads</CardTitle>
          <CardDescription>Total resumes uploaded per day</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="uploads"
                  labelFormatter={(value: string | number | Date) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar dataKey="uploads" fill="#f97316" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
