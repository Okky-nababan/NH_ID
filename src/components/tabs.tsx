"use client";

import { useState, type ReactNode } from "react";

type Tab = {
  id: string;
  label: string;
  content: ReactNode;
};

export function Tabs({ tabs, initialTab }: { tabs: Tab[]; initialTab?: string }) {
  const [active, setActive] = useState(initialTab ?? tabs[0]?.id);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`rounded-t-md px-3 py-2 text-sm font-semibold ${
              activeTab?.id === tab.id
                ? "border-b-2 border-brand text-brand"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{activeTab?.content}</div>
    </div>
  );
}
