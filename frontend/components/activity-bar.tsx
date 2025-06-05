"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  IconCreditCard,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";

export interface ActivityBarItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
  order?: number;
}

interface ActivityBarProps {
  items: ActivityBarItem[];
  currentSelectedIndex: number;
  onSelect?: (index: number, item: ActivityBarItem) => void;
  className?: string;
  user?: {
    name: string;
    email: string;
    avatar: string;
  } | null;
}

export function ActivityBar({
  items,
  currentSelectedIndex,
  onSelect,
  className,
  user,
}: ActivityBarProps) {
  const router = useRouter();

  const handleItemClick = (index: number, item: ActivityBarItem) => {
    if (index !== currentSelectedIndex) {
      onSelect?.(index, item);
      router.push(item.path);
    }
  };

  const handleLogout = () => {
    // 清除认证信息
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    // 跳转到登录页面
    router.push('/login');
  };

  // 生成用户名首字母作为头像后备
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn(
      "flex h-full w-16 flex-col bg-muted border-r border-border",
      className
    )}>
      {/* Activity Bar Items */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center gap-1 p-2 pt-4">
          <TooltipProvider delayDuration={0}>
            {items.map((item, index) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentSelectedIndex === index ? "default" : "ghost"}
                    size="icon"
                    onClick={() => handleItemClick(index, item)}
                    className={cn(
                      "h-10 w-10 rounded-md transition-colors",
                      currentSelectedIndex === index
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                    )}
                    aria-label={item.name}
                  >
                    {item.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" className="font-medium">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </ScrollArea>

      {/* User Section */}
      {user && (
        <div className="border-t border-border p-2">
          <TooltipProvider delayDuration={0}>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-md transition-colors text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                      aria-label={`User menu - ${user.name}`}
                    >
                      <Avatar className="h-6 w-6 rounded-md">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-xs">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" className="font-medium">
                  {user.name}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <IconUserCircle className="mr-2 h-4 w-4" />
                    账户设置
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconCreditCard className="mr-2 h-4 w-4" />
                    账单管理
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconNotification className="mr-2 h-4 w-4" />
                    通知设置
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <IconLogout className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
} 