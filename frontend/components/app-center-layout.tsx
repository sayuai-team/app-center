"use client";

import React, { useState, useEffect, useRef } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ActivityBar, ActivityBarItem } from "./activity-bar";

export interface SidebarConfig {
  preferredSize?: number;
  minSize?: number;
  maxSize?: number;
}

export interface AppCenterLayoutOptions {
  currentSelectedIndex?: number;
  items?: ActivityBarItem[];
  activityBarWidth?: number;
  primarySidebar?: SidebarConfig;
  secondarySidebar?: SidebarConfig;
}

interface AppCenterLayoutProps {
  options?: AppCenterLayoutOptions;
  primaryContent?: React.ReactNode;
  mainContent?: React.ReactNode;
  secondaryContent?: React.ReactNode;
  onViewChange?: (index: number, item: ActivityBarItem) => void;
  className?: string;
  user?: {
    name: string;
    email: string;
    avatar: string;
  } | null;
}

// Default configurations
const DEFAULT_ACTIVITY_BAR_WIDTH = 64;
const DEFAULT_PRIMARY_SIDEBAR = {
  preferredSize: 280,
  minSize: 200,
  maxSize: 320
};
const DEFAULT_SECONDARY_SIDEBAR = {
  preferredSize: 300,
  minSize: 200,
  maxSize: 500
};

export function AppCenterLayout({
  options = { currentSelectedIndex: 0, items: [] },
  primaryContent,
  mainContent,
  secondaryContent,
  onViewChange,
  className,
  user
}: AppCenterLayoutProps) {
  // 存储当前视图索引
  const [activeView, setActiveView] = useState(() =>
    options?.currentSelectedIndex !== undefined ? options.currentSelectedIndex : 0
  );

  // 使用ref跟踪外部和内部更新，防止循环
  const isExternalUpdate = useRef(false);
  const prevExternalIndex = useRef(options?.currentSelectedIndex);
  
  // Allotment ref for reset functionality
  const allotmentRef = useRef<any>(null);

  const pathname = usePathname();
  const router = useRouter();

  // Get configurations with fallbacks to defaults
  const activityBarWidth = options?.activityBarWidth || DEFAULT_ACTIVITY_BAR_WIDTH;
  const primarySidebarConfig = {
    ...DEFAULT_PRIMARY_SIDEBAR,
    ...options?.primarySidebar
  };
  const secondarySidebarConfig = {
    ...DEFAULT_SECONDARY_SIDEBAR,
    ...options?.secondarySidebar
  };

  // 仅在props.currentSelectedIndex真正变化时更新状态
  useEffect(() => {
    // 如果当前值和上一次值不同，这是一个真正的外部更新
    if (options?.currentSelectedIndex !== undefined &&
        options.currentSelectedIndex !== prevExternalIndex.current) {

      isExternalUpdate.current = true;
      setActiveView(options.currentSelectedIndex);
      prevExternalIndex.current = options.currentSelectedIndex;
    }
  }, [options?.currentSelectedIndex]);

  // 仅在内部状态变化时调用onViewChange
  useEffect(() => {
    // 如果是内部更新（不是由props触发的），则调用回调
    if (!isExternalUpdate.current && onViewChange &&
        activeView !== options?.currentSelectedIndex &&
        options?.items && options.items[activeView]) {
      onViewChange(activeView, options.items[activeView]);
    } else {
      // 重置标志，准备检测下一次更新
      isExternalUpdate.current = false;
    }
  }, [activeView, onViewChange, options?.currentSelectedIndex, options?.items]);

  // ActivityBar选择处理器 - 内部更新
  const handleViewSelect = (index: number, item: ActivityBarItem) => {
    if (index !== activeView) {
      setActiveView(index);
      onViewChange?.(index, item);
    }
  };

  // 添加键盘事件监听，用于重置布局（Ctrl+Shift+R 或 Cmd+Shift+R）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && e.shiftKey) {
        e.preventDefault();
        console.log('重置 Allotment 布局...');
        // 重置 Allotment 布局到默认尺寸
        if (allotmentRef.current) {
          allotmentRef.current.resize([activityBarWidth, primarySidebarConfig.preferredSize]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activityBarWidth, primarySidebarConfig.preferredSize]);

  return (
    <div className={cn("flex h-screen w-screen overflow-hidden", className)}>
      <Allotment 
        ref={allotmentRef}
        defaultSizes={[activityBarWidth, primarySidebarConfig.preferredSize]}
        proportionalLayout={false} 
        separator={true} 
        snap={false}
        onChange={(sizes) => {
          console.log('面板尺寸变化:', sizes);
        }}
        onDragStart={() => {
          console.log('开始拖拽');
        }}
        onDragEnd={(sizes) => {
          console.log('拖拽结束:', sizes);
        }}
      >
        {/* Activity Bar */}
        <Allotment.Pane
          minSize={activityBarWidth}
          maxSize={activityBarWidth}
        >
          <ActivityBar
            items={options.items || []}
            currentSelectedIndex={activeView}
            onSelect={handleViewSelect}
            user={user}
          />
        </Allotment.Pane>

        {/* Primary Sidebar */}
        {primaryContent && (
          <Allotment.Pane
            minSize={primarySidebarConfig.minSize}
            maxSize={primarySidebarConfig.maxSize}
          >
            <div className="flex h-full w-full flex-col overflow-auto bg-background border-r border-border">
              <div className="flex-1 overflow-auto">
                {primaryContent}
              </div>
            </div>
          </Allotment.Pane>
        )}

        {/* Main Content */}
        {mainContent && (
          <Allotment.Pane>
            <div className="h-full bg-background">
              <div className="flex h-full w-full flex-col overflow-hidden">
                <div className="flex-1 overflow-auto min-w-0">
                  <div className="w-full min-w-0">
                    {mainContent}
                  </div>
                </div>
              </div>
            </div>
          </Allotment.Pane>
        )}

        {/* Secondary Sidebar */}
        {secondaryContent && (
          <Allotment.Pane
            preferredSize={secondarySidebarConfig.preferredSize}
            minSize={secondarySidebarConfig.minSize}
            maxSize={secondarySidebarConfig.maxSize}
            snap
          >
            <div className="flex h-full w-full flex-col overflow-auto bg-background border-l border-border">
              <div className="flex-1 overflow-auto">
                {secondaryContent}
              </div>
            </div>
          </Allotment.Pane>
        )}
      </Allotment>
    </div>
  );
} 