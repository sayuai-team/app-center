import React from "react";
import { Package, Upload, Settings, Monitor, Users } from "lucide-react";
import { ActivityBarItem } from "@/components/activity-bar";

export const appCenterActivityItems: ActivityBarItem[] = [
  {
    id: "apps",
    name: "Applications",
    icon: <Package className="h-5 w-5" />,
    path: "/dashboard",
    order: 1
  },
  {
    id: "upload",
    name: "Upload",
    icon: <Upload className="h-5 w-5" />,
    path: "/dashboard/upload",
    order: 2
  },
  {
    id: "install",
    name: "Install",
    icon: <Monitor className="h-5 w-5" />,
    path: "/install",
    order: 3
  },
  {
    id: "users",
    name: "Users",
    icon: <Users className="h-5 w-5" />,
    path: "/dashboard/users",
    order: 4
  },
  {
    id: "settings",
    name: "Settings",
    icon: <Settings className="h-5 w-5" />,
    path: "/dashboard/settings",
    order: 5
  }
];

// 按 order 排序
export const sortedAppCenterActivityItems = [...appCenterActivityItems].sort(
  (a, b) => (a.order || 999) - (b.order || 999)
); 