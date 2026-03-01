import React from "react";

export default function NotFound(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground">الصفحة غير موجودة</p>
      </div>
    </div>
  );
}
