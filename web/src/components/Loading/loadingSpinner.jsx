import React from "react";

export default function LoadingSpinner() {
  return (
    <div className="table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Loading products...
      </p>
    </div>
  );
}
