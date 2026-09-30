"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const USER_DETAIL_TABS = [
  { value: "profile", label: "Profile" },
  { value: "account", label: "Account" },
  { value: "xp", label: "XP & Level" },
  { value: "sessions", label: "Devices & Sessions" },
  { value: "login-history", label: "Login history" },
  { value: "enforcement", label: "Enforcement" },
  { value: "notes", label: "Admin notes" },
  { value: "activity", label: "Activity" },
] as const;

export type UserDetailTab = (typeof USER_DETAIL_TABS)[number]["value"];

export const DEFAULT_USER_DETAIL_TAB: UserDetailTab = "profile";

export function isUserDetailTab(value: string | null): value is UserDetailTab {
  return USER_DETAIL_TABS.some((tab) => tab.value === value);
}

export function userDetailTabLabel(tab: UserDetailTab): string {
  return USER_DETAIL_TABS.find((candidate) => candidate.value === tab)?.label ?? "Profile";
}

interface UserDetailTabsProps {
  activeTab: UserDetailTab;
  onTabChange: (tab: UserDetailTab) => void;
  children: ReactNode;
}

/** Accessible tabs controlled by the user detail route's URL. */
export function UserDetailTabs({ activeTab, onTabChange, children }: UserDetailTabsProps) {
  const tabRefs = useRef<Partial<Record<UserDetailTab, HTMLButtonElement | null>>>({});

  const moveTo = (index: number) => {
    const tab = USER_DETAIL_TABS[(index + USER_DETAIL_TABS.length) % USER_DETAIL_TABS.length];
    onTabChange(tab.value);
    tabRefs.current[tab.value]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveTo(index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveTo(index - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(USER_DETAIL_TABS.length - 1);
        break;
    }
  };

  const tabListId = "user-detail-tabs";
  const activePanelId = `${tabListId}-panel-${activeTab}`;

  return (
    <section aria-label="User detail sections" className="flex min-w-0 flex-col gap-4">
      <div
        id={tabListId}
        role="tablist"
        aria-label="User detail sections"
        aria-orientation="horizontal"
        className="border-border min-w-0 overflow-x-auto border-b"
      >
        <div className="flex min-w-max gap-1" role="presentation">
          {USER_DETAIL_TABS.map((tab, index) => {
            const selected = tab.value === activeTab;
            const triggerId = `${tabListId}-tab-${tab.value}`;

            return (
              <button
                key={tab.value}
                ref={(element) => {
                  tabRefs.current[tab.value] = element;
                }}
                id={triggerId}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={selected ? activePanelId : undefined}
                tabIndex={selected ? 0 : -1}
                onClick={() => onTabChange(tab.value)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  "relative min-h-10 whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium outline-none transition-colors",
                  "text-muted-foreground hover:bg-muted hover:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selected && "bg-muted text-foreground after:bg-primary after:absolute after:inset-x-2 after:-bottom-px after:h-0.5",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={activePanelId}
        role="tabpanel"
        aria-labelledby={`${tabListId}-tab-${activeTab}`}
        tabIndex={0}
        className="min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {children}
      </div>
    </section>
  );
}
