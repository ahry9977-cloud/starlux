import React from "react";

export function DashboardLayoutSkeleton(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="h-10 w-48 bg-white/10 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <div className="h-12 bg-white/10 rounded" />
            <div className="h-12 bg-white/10 rounded" />
            <div className="h-12 bg-white/10 rounded" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="h-40 bg-white/10 rounded" />
            <div className="h-64 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
