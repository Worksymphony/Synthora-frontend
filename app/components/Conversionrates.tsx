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

const stages = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;

type Stage = typeof stages[number];

const stageColors: Record<Stage, string> = {
  applied: "#3b82f6",
  screening: "#f59e0b",
  interview: "#10b981",
  offer: "#8b5cf6",
  hired: "#14b8a6",
  rejected: "#ef4444",
};

export function ConversionRates() {
  const [counts, setCounts] = useState<Record<Stage, number>>({
    applied: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    hired: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "resumes"));
        const tempCounts: Record<Stage, number> = {
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

          if (stages.includes(status)) {
            tempCounts[status as Stage]++;
          }
        });

        setCounts(tempCounts);
      } catch (error) {
        console.error("Error fetching counts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
  }, []);

  // Calculate conversion rates (percentage of next stage vs current)
  const conversionRates = stages.slice(0, -1).map((stage, idx) => {
    const currentCount = counts[stage];
    const nextStage = stages[idx + 1];
    const nextCount = counts[nextStage];
    const rate =
      currentCount > 0 ? Math.round((nextCount / currentCount) * 100) : 0;
    return { from: stage, to: nextStage, rate };
  });

  if (loading) return <p>Loading conversion rates...</p>;

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Hiring Pipeline Conversion Rates</CardTitle>
        <CardDescription>
          Percentage of resumes moving from one stage to the next
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 overflow-x-auto py-2">
          {stages.map((stage, idx) => (
            <React.Fragment key={stage}>
              <div
                className="flex flex-col items-center justify-center rounded-md px-4 py-3 min-w-[120px]"
                style={{ backgroundColor: stageColors[stage], color: "white" }}
              >
                <span className="uppercase text-xs font-bold tracking-wider">
                  {stage}
                </span>
                <span className="text-2xl font-extrabold">{counts[stage]}</span>
              </div>

              {/* Show conversion arrow and rate except for last stage */}
              {idx < stages.length - 1 && (
                <div className="flex flex-col items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-700 font-semibold">
                    {conversionRates[idx].rate}%
                  </span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
