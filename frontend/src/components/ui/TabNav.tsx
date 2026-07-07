type TabNavItem<T extends string> = {
  id: T;
  label: string;
  hidden?: boolean;
};

type TabNavProps<T extends string> = {
  tabs: TabNavItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
};

export function TabNav<T extends string>({ tabs, activeId, onChange }: TabNavProps<T>) {
  const visibleTabs = tabs.filter((tab) => !tab.hidden);

  return (
    <div className="flex flex-wrap gap-2">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeId === tab.id
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
