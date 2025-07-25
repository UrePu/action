"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Chart,
  TooltipItem,
} from "chart.js";
import { useTheme } from "next-themes";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type OcrData = {
  id: number;
  items: number[];
  created_at: string;
};

type GroupUnit = "minute" | "tenMinute" | "hour" | "day" | "month";

const fetchHistory = async (): Promise<OcrData[]> => {
  const { data: ocrData, error } = await supabase
    .from("ocr_data")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase error:", error);
    throw new Error("데이터를 불러오는 중 오류가 발생했습니다.");
  }
  return ocrData || [];
};

function formatGroupKey(date: Date, unit: GroupUnit) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  if (unit === "minute") return `${y}-${m}-${d} ${h}:${min}`;
  if (unit === "tenMinute") {
    const tenMin = (Math.floor(Number(min) / 10) * 10)
      .toString()
      .padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${tenMin}`;
  }
  if (unit === "hour") return `${y}-${m}-${d} ${h}`;
  if (unit === "day") return `${y}-${m}-${d}`;
  if (unit === "month") return `${y}-${m}`;
  return "";
}

function groupOcrData(data: OcrData[], unit: GroupUnit) {
  const groups: Record<string, OcrData[]> = {};
  data.forEach((record) => {
    const key = formatGroupKey(new Date(record.created_at), unit);
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
  });
  // 그룹별로 대표값(최신 데이터)만 사용, 통계는 그룹 전체로 계산
  return Object.entries(groups)
    .map(([key, records]) => {
      // 모든 items 합치기
      const allItems = records.flatMap((r) => r.items);
      // 대표 created_at은 그룹 내 최신값
      const created_at = records.reduce(
        (latest, r) =>
          new Date(r.created_at) > new Date(latest) ? r.created_at : latest,
        records[0].created_at
      );
      return {
        id: records[0].id, // 대표 id (첫번째)
        items: allItems,
        created_at,
        groupKey: key,
      };
    })
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}

export function HistoryView() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [unit, setUnit] = useState<GroupUnit>("tenMinute");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    ChartJS.defaults.font.family = "Maplestory";
  }, []);

  const queryResult = useQuery<OcrData[]>({
    queryKey: ["ocrHistory"],
    queryFn: fetchHistory,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });
  const { data, isLoading, error, refetch, isRefetching } = queryResult;
  const grouped = useMemo(
    () => (data ? groupOcrData(data, unit) : []),
    [data, unit]
  );
  const unitLimits: Record<GroupUnit, number | undefined> = {
    minute: 60, // 1시간
    tenMinute: 60, // 6시간
    hour: 60, // 12시간
    day: 60, // 24시간
    month: 60, // 30일
  };
  const limitedGrouped = useMemo(() => {
    const limit = unitLimits[unit];
    if (limit && grouped.length > limit) {
      return grouped.slice(-limit);
    }
    return grouped;
  }, [grouped, unit]);
  const chartData =
    limitedGrouped.length > 0
      ? {
          labels: limitedGrouped.map(
            (record) =>
              record.groupKey ??
              new Date(record.created_at).toLocaleDateString("ko-KR")
          ),
          datasets: [
            {
              label: "최고가",
              data: limitedGrouped.map((record) =>
                record.items.length > 0 ? Math.max(...record.items) : null
              ),
              borderColor: isDark ? "#4ade80" : "rgb(34, 197, 94)",
              backgroundColor: isDark
                ? "rgba(74, 222, 128, 0.2)"
                : "rgba(34, 197, 94, 0.2)",
              tension: 0.2,
              pointStyle: "rect",
            },
            {
              label: "평균가",
              data: limitedGrouped.map((record) =>
                record.items.length > 0
                  ? Math.round(
                      record.items.reduce((sum, item) => sum + item, 0) /
                        record.items.length
                    )
                  : null
              ),
              borderColor: isDark ? "#a78bfa" : "rgb(168, 85, 247)",
              backgroundColor: isDark
                ? "rgba(167, 139, 250, 0.2)"
                : "rgba(168, 85, 247, 0.2)",
              tension: 0.2,
              pointStyle: "rect",
            },
            {
              label: "최저가",
              data: limitedGrouped.map((record) =>
                record.items.length > 0 ? Math.min(...record.items) : null
              ),
              borderColor: isDark ? "#60a5fa" : "rgb(59, 130, 246)",
              backgroundColor: isDark
                ? "rgba(96, 165, 250, 0.2)"
                : "rgba(59, 130, 246, 0.2)",
              tension: 0.2,
              pointStyle: "rect",
            },
          ],
        }
      : undefined;

  if (!mounted) return null;

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { family: "Maplestory" },
        },
      },
      title: {
        display: true,
        text: "가격 변동 차트",
        font: { family: "Maplestory" },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(30,41,59,0.95)",
        borderColor: "#3b82f6",
        borderWidth: 2,
        titleColor: "#fff",
        bodyColor: "#fff",
        displayColors: true,
        usePointStyle: true,
        bodyFont: { size: 15, family: "Maplestory" },
        titleFont: { size: 16, family: "Maplestory" },
        callbacks: {
          label: function (context: TooltipItem<"line">) {
            const { dataset, dataIndex, parsed } = context;
            let label = `${dataset.label ?? ""}: ${parsed.y?.toLocaleString()}`;
            if (dataIndex > 0) {
              const prev = dataset.data[dataIndex - 1];
              if (typeof prev === "number" && typeof parsed.y === "number") {
                const diff = parsed.y - prev;
                const percent = prev !== 0 ? (diff / prev) * 100 : 0;
                const sign = diff > 0 ? "+" : "";
                label += `  (${sign}${diff.toLocaleString()}  ${sign}${percent.toFixed(
                  1
                )}%)`;
              }
            }
            return label;
          },
        },
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
      axis: "x" as const,
    },
    hover: {
      mode: "index" as const,
      intersect: false,
      axis: "x" as const,
    },
    scales: {
      y: {
        ticks: {
          font: { family: "Maplestory" },
          callback: (value: string | number) =>
            typeof value === "number" ? value.toLocaleString() : value,
        },
      },
      x: {
        ticks: {
          font: { family: "Maplestory" },
        },
      },
    },
    elements: {
      line: {
        borderWidth: 3,
      },
      point: {
        radius: 3,
        hoverRadius: 6,
      },
    },
    font: { family: "Maplestory" },
  } as const;

  return (
    <div className="min-h-screen p-8 pb-20 bg-gray-50 dark:bg-gray-900">
      <main className="max-w-6xl mx-auto flex flex-col gap-8 items-center sm:items-start">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            솔 에르다 조각 - 히스토리
          </h1>
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading || isRefetching ? "로딩중..." : "새로고침"}
          </button>
          <div className="flex gap-2 ml-4 mt-2 sm:mt-0">
            {[
              { label: "분별", value: "minute" },
              { label: "10분별", value: "tenMinute" },
              { label: "시간별", value: "hour" },
              { label: "일별", value: "day" },
              { label: "월별", value: "month" },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setUnit(btn.value as GroupUnit)}
                className={`px-5 py-2 rounded-lg border text-base font-semibold transition-colors
                  ${
                    unit === btn.value
                      ? "bg-blue-500 text-white border-blue-500 shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                  }
                `}
                style={{ minWidth: 72 }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-red-500 bg-red-100 dark:text-red-200 dark:bg-red-900 p-4 rounded">
            {error.message}
          </div>
        )}

        {isLoading ? (
          <div className="text-gray-500 dark:text-gray-300">
            데이터를 불러오는 중...
          </div>
        ) : limitedGrouped.length > 0 ? (
          <>
            {chartData && (
              <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 mb-8 overflow-x-auto">
                <div className="min-w-[380px] min-h-[320px] sm:min-w-[520px] sm:min-h-[400px] md:min-w-[900px] md:min-h-[500px]">
                  <Line
                    data={chartData}
                    options={options}
                    height={500}
                    plugins={[
                      {
                        id: "crosshairLine",
                        afterDatasetsDraw: (chart: Chart) => {
                          const tooltip = chart.tooltip;
                          if (
                            tooltip &&
                            tooltip.opacity > 0 &&
                            tooltip.dataPoints &&
                            tooltip.dataPoints.length > 0
                          ) {
                            const ctx = chart.ctx;
                            const x = tooltip.dataPoints[0].element.x;
                            ctx.save();
                            ctx.beginPath();
                            ctx.moveTo(x, chart.chartArea.top);
                            ctx.lineTo(x, chart.chartArea.bottom);
                            ctx.lineWidth = 3;
                            ctx.globalAlpha = 1;
                            ctx.setLineDash([]);
                            ctx.strokeStyle = isDark ? "#fff" : "#111";
                            ctx.shadowBlur = 0;
                            ctx.stroke();
                            ctx.restore();
                          }
                        },
                      },
                    ]}
                  />
                </div>
              </div>
            )}
            <div className="space-y-4 w-full">
              {[...limitedGrouped].reverse().map((record) => (
                <div
                  key={record.groupKey}
                  className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
                >
                  {/* 기본 정보 (클릭 가능) */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 dark:hover:border-blue-700 dark:border transition-colors"
                    onClick={() => toggleExpanded(record.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {record.groupKey}
                        </h2>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {new Date(record.created_at).toLocaleString("ko-KR")}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* 가격 요약 */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-300">
                            {record.items.length > 0
                              ? Math.min(...record.items).toLocaleString()
                              : "N/A"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">
                            최저가
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600 dark:text-green-300">
                            {record.items.length > 0
                              ? Math.max(...record.items).toLocaleString()
                              : "N/A"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">
                            최고가
                          </div>
                        </div>
                        <div className="text-gray-400">
                          {expandedId === record.id ? "▼" : "▶"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 확장된 상세 정보 */}
                  {expandedId === record.id && (
                    <div className="border-t bg-gray-50 dark:bg-gray-900 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 가격 분석 */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                            가격 분석
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>최저가:</span>
                              <span className="font-medium">
                                {record.items.length > 0
                                  ? Math.min(...record.items).toLocaleString() +
                                    " 메소"
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>최고가:</span>
                              <span className="font-medium">
                                {record.items.length > 0
                                  ? Math.max(...record.items).toLocaleString() +
                                    " 메소"
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>평균가:</span>
                              <span className="font-medium">
                                {record.items.length > 0
                                  ? Math.round(
                                      record.items.reduce(
                                        (sum, item) => sum + item,
                                        0
                                      ) / record.items.length
                                    ).toLocaleString() + " 메소"
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>가격 차이:</span>
                              <span className="font-medium">
                                {record.items.length > 0
                                  ? (
                                      Math.max(...record.items) -
                                      Math.min(...record.items)
                                    ).toLocaleString() + " 메소"
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center relative group">
                              <span className="flex items-center gap-1">
                                가격 변동폭:
                                <span className="ml-1 cursor-pointer text-blue-400 relative">
                                  <span
                                    className="inline-block w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center border border-blue-300"
                                    tabIndex={0}
                                  >
                                    ?
                                  </span>
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 min-w-[220px] max-w-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs rounded shadow-lg px-4 py-3 z-50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity whitespace-pre-line break-keep">
                                    최저가 대비 최고가의 비율(%)을 의미합니다.
                                    예) 100%면 두 배, 50%면 1.5배
                                  </div>
                                </span>
                              </span>
                              <span className="font-medium">
                                {record.items.length > 0
                                  ? (
                                      ((Math.max(...record.items) -
                                        Math.min(...record.items)) /
                                        Math.min(...record.items)) *
                                      100
                                    ).toFixed(1) + "%"
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 기록 정보 */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                            기록 정보
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>기록 ID:</span>
                              <span className="font-medium">{record.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>생성 시간:</span>
                              <span className="font-medium">
                                {new Date(record.created_at).toLocaleString(
                                  "ko-KR"
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>생성일:</span>
                              <span className="font-medium">
                                {new Date(record.created_at).toLocaleDateString(
                                  "ko-KR"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>히스토리 데이터가 없습니다.</p>
            <p className="text-sm mt-2">
              가격 정보가 저장되면 여기에 표시됩니다.
            </p>
          </div>
        )}
      </main>
      <footer className="mt-16 flex gap-6 flex-wrap items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <span>솔 에르다 조각 가격 추적기</span>
      </footer>
    </div>
  );
}
