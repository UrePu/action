"use client";

import Link from "next/link";
import { useState } from "react";

export function Navigation() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm fixed top-0 left-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center h-16 justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-lg font-bold text-gray-900 dark:text-gray-100 focus:outline-none"
              aria-haspopup="true"
              aria-expanded={open}
            >
              솔 에르다 조각
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {open && (
              <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 z-50 animate-fade-in">
                <Link
                  href="/erda/price"
                  className="block px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-800"
                  onClick={() => setOpen(false)}
                >
                  가격 정보
                </Link>
                <Link
                  href="/erda/history"
                  className="block px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-purple-50 dark:hover:bg-purple-800"
                  onClick={() => setOpen(false)}
                >
                  히스토리
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
