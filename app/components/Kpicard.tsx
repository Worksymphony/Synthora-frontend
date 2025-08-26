import React from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon }) => {
  return (
    <Card className="border-none shadow-lg rounded-lg hover:shadow-xl transition-shadow cursor-default">
      <CardContent className="flex items-center space-x-4">
        {icon && (
          <div className="p-3 bg-orange-600 text-white rounded-full text-2xl">
            {icon}
          </div>
        )}
        <div>
          <CardTitle className="text-gray-500 uppercase tracking-widest text-xs">
            {title}
          </CardTitle>
          <p className="text-3xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};
