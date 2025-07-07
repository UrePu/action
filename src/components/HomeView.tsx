"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// OCR 데이터 타입 정의
interface OcrData {
  id: number;
  items: number[];
  created_at: string;
}

const fetchLatestData = async (): Promise<OcrData | null> => {
  const { data: ocrData, error } = await supabase
    .from("ocr_data")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error) {
    console.error("Supabase error:", error);
    throw new Error("데이터를 불러오는 중 오류가 발생했습니다.");
  }
  return ocrData;
};

const getPriceStats = (items: number[]) => {
  const minPrice = Math.min(...items);
  const maxPrice = Math.max(...items);
  const avgPrice = Math.round(
    items.reduce((sum, price) => sum + price, 0) / items.length
  );
  return { minPrice, maxPrice, avgPrice };
};

export function HomeView() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["latestOcrData"],
    queryFn: fetchLatestData,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });

  return (
    <div className="min-h-screen p-8 pb-20 font-[family-name:var(--font-geist-sans)] bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto flex flex-col gap-8 items-center sm:items-start">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            솔 에르다 조각 가격
          </h1>
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading || isRefetching ? "로딩중..." : "새로고침"}
          </button>
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
        ) : data ? (
          <div className="space-y-6 w-full">
            {/* 가격 통계 */}
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                가격 통계
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                    {data.items.length > 0
                      ? getPriceStats(data.items).minPrice.toLocaleString()
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    최저가 (메소)
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                    {data.items.length > 0
                      ? getPriceStats(data.items).maxPrice.toLocaleString()
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    최고가 (메소)
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                    {data.items.length > 0
                      ? getPriceStats(data.items).avgPrice.toLocaleString()
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    평균가 (메소)
                  </div>
                </div>
              </div>
            </div>

            {/* 개별 매물 가격 */}
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                개별 매물 가격
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {data.items.map((price, idx) => (
                  <div
                    key={idx}
                    className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-100"
                  >
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {idx + 1}번
                    </div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100">
                      {price.toLocaleString()} 메소
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 생성 시간 */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              마지막 업데이트:{" "}
              {new Date(data.created_at).toLocaleString("ko-KR")}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>데이터가 없습니다.</p>
            <p className="text-sm mt-2">
              가격 정보가 저장되면 자동으로 표시됩니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
