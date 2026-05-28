"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
      <div className="w-full rounded-[28px] border border-[#f1c5c1] bg-white/96 p-6 shadow-[0_18px_50px_rgba(163,63,47,0.08)]">
        <h1 className="text-xl font-semibold text-[#8d3628]">页面加载失败</h1>
        <p className="mt-3 text-sm leading-6 text-[#8b5a53]">
          {error.message || "发生了一个未预期的错误。"}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 flex h-11 items-center justify-center rounded-2xl bg-[#8d3628] px-4 text-sm font-semibold text-white"
        >
          重新尝试
        </button>
      </div>
    </main>
  );
}
