import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-xl w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-10 flex flex-col items-center gap-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
          솔 에르다 조각 가격 추적기
        </h1>
        <p className="text-lg text-center text-gray-700 dark:text-gray-300 mb-4">
          메이플스토리 옥션의 솔 에르다 조각 실시간 가격 정보를 확인하세요.
          <br />
          OCR 자동화로 최신 시세를 빠르게 제공합니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/erda/price"
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold text-center hover:bg-blue-600 transition"
          >
            가격 정보 바로가기
          </Link>
          <Link
            href="/erda/stats"
            className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg text-lg font-semibold text-center hover:bg-purple-600 transition"
          >
            View Stats
          </Link>
        </div>
        <div className="mt-8 text-sm text-gray-400 text-center">
          &copy; {new Date().getFullYear()} 솔 에르다 조각 가격 추적기
        </div>
      </div>
    </div>
  );
}
