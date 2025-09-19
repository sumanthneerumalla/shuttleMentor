"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import type { NavItem } from "~/app/_components/server/NavigationItems";

// Icon components
const icons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9"></rect>
      <rect x="14" y="3" width="7" height="5"></rect>
      <rect x="14" y="12" width="7" height="9"></rect>
      <rect x="3" y="16" width="7" height="5"></rect>
    </svg>
  ),
  video: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"></polygon>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>
  ),
  profile: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  admin: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path>
      <path d="M12 6v4l3 3"></path>
    </svg>
  ),
};

interface ClientSideNavigationProps {
  items: NavItem[];
  isLoading?: boolean;
}

export default function ClientSideNavigation({ items, isLoading = false }: ClientSideNavigationProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const renderNavItems = (navItems: NavItem[]) => {
    return navItems.map((item) => {
      const isActive = item.href ? pathname === item.href : false;
      const hasChildren = item.children && item.children.length > 0;
      const isOpen = openGroups[item.label] || false;
      
      return (
        <div key={item.label} className="mb-1">
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm rounded-lg transition-colors",
                isActive
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                  : "hover:bg-[var(--accent)] text-gray-700"
              )}
            >
              {item.icon && icons[item.icon] && <span className="mr-3">{icons[item.icon]}</span>}
              {item.label}
            </Link>
          ) : (
            <button
              onClick={() => toggleGroup(item.label)}
              className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-[var(--accent)] transition-colors"
            >
              <div className="flex items-center">
                {item.icon && icons[item.icon] && <span className="mr-3">{icons[item.icon]}</span>}
                {item.label}
              </div>
              {hasChildren && (
                <span className="ml-auto">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              )}
            </button>
          )}

          {/* Render children if this item has them and is open */}
          {hasChildren && isOpen && item.children && (
            <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
              {item.children.map((child) => {
                const isChildActive = child.href ? pathname === child.href : false;
                
                return (
                  <Link
                    key={child.label}
                    href={child.href || "#"}
                    className={cn(
                      "flex items-center px-4 py-2 text-sm rounded-lg transition-colors",
                      isChildActive
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                        : "hover:bg-[var(--accent)] text-gray-700"
                    )}
                  >
                    {child.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full overflow-y-auto border-r border-gray-200 p-4">
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <nav className="space-y-1">
          {renderNavItems(items)}
        </nav>
      )}
    </div>
  );
}
