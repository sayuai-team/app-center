import React from "react";
import { Package, Upload, Settings, Monitor, Users } from "lucide-react";
import { ActivityBarItem } from "@/components/activity-bar";

export const appCenterActivityItems: ActivityBarItem[] = [
  {
    id: "apps",
    name: "Applications",
    icon: <Package className="h-5 w-5" />,
    path: "/dashboard/apps",
    order: 1
  },
  {
    id: "users",
    name: "Users",
    icon: <Users className="h-5 w-5" />,
    path: "/dashboard/users",
    order: 2
  }
];

// 按 order 排序
export const sortedAppCenterActivityItems = [...appCenterActivityItems].sort(
  (a, b) => (a.order || 999) - (b.order || 999)
); 