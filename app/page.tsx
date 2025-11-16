// app/page.tsx
import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-60 flex-col gap-2 bg-black/90 p-4 text-sm text-slate-200 md:flex">
          {/* Logo placeholder */}
          <Link
            href="/"
            className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight hover:opacity-90 transition"
          >
            <div className="h-8 w-8 rounded-full bg-green-500" />
            <span className="text-white">Strudelify</span>
          </Link>

          {/* Add Submission button */}
          <a
            href="/submit"
            className="mb-4 inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black shadow-md shadow-emerald-500/40 transition hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/50"
          >
            + Add Submission
          </a>

          <div className="mt-4 border-t border-zinc-800 pt-4 text-xs text-slate-400">
            <p className="mb-1 font-semibold uppercase tracking-widest">
              Resources
            </p>
            <div className="mt-2 space-y-1 text-slate-300">
              <a
                href="https://strudel.cc/learn/getting-started/"
                target="_blank"
                rel="noreferrer"
                className="block cursor-pointer truncate hover:text-white"
              >
                Getting Started
              </a>
              <a
                href="https://strudel.cc/learn/first-sounds/"
                target="_blank"
                rel="noreferrer"
                className="block cursor-pointer truncate hover:text-white"
              >
                First Sounds (Workshop)
              </a>
              <a
                href="https://strudel.cc/learn/code/"
                target="_blank"
                rel="noreferrer"
                className="block cursor-pointer truncate hover:text-white"
              >
                Coding Syntax
              </a>
              <a
                href="https://strudel.cc/learn/sounds/"
                target="_blank"
                rel="noreferrer"
                className="block cursor-pointer truncate hover:text-white"
              >
                Sounds
              </a>
              <a
                href="https://strudel.cc/learn/synths/"
                target="_blank"
                rel="noreferrer"
                className="block cursor-pointer truncate hover:text-white"
              >
                Synths
              </a>
            </div>
          </div>
        </aside>



        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-zinc-800 via-zinc-900 to-black">

          {/* Scrollable area */}
          <div className="flex-1 overflow-y-auto">
            {/* Artist banner */}
            <section className="relative flex flex-col gap-4 bg-gradient-to-b from-emerald-700 via-emerald-900/60 to-transparent px-4 pb-6 pt-6 md:flex-row md:items-end md:px-8 md:pb-8 md:pt-10">
              <div className="flex justify-center md:justify-start">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-900 shadow-xl shadow-black md:h-48 md:w-48" />
              </div>

              <div className="mt-4 flex flex-1 flex-col justify-end gap-3 text-center md:mt-0 md:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  Verified Artist
                </p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  Strudel Hackathon
                </h1>
                <p className="text-sm text-emerald-100/90 md:text-base">
                  42,001 monthly listeners
                </p>
              </div>
            </section>

            {/* Sticky controls + winners section */}
            <section className="relative z-10 -mt-4 rounded-t-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-black px-4 pb-12 pt-4 md:px-8">
              {/* Controls row */}
              <div className="mb-6 flex items-center gap-4">
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-500/40 hover:scale-105 hover:bg-emerald-400">
                  {/* Play triangle */}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 fill-black"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <button className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-semibold text-slate-100 hover:border-zinc-500">
                  Follow
                </button>
                <span className="text-2xl text-zinc-400">•••</span>
              </div>

              {/* Winning Songs */}
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-white">
                  Winners
                </h2>
                <div className="space-y-1 text-sm">
                  {[
                    {
                      title: "People's Choice",
                      plays: "1,203,948",
                      duration: "3:42",
                    },
                    {
                      title: "Most Creative",
                      plays: "893,210",
                      duration: "4:05",
                    },
                    {
                      title: "Best Presentation",
                      plays: "541,226",
                      duration: "5:11",
                    },
                    {
                      title: "another one",
                      plays: "332,789",
                      duration: "3:58",
                    },
                    {
                      title: "anotherer one",
                      plays: "210,004",
                      duration: "4:21",
                    },
                  ].map((track, idx) => (
                    <div
                      key={track.title}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-md px-3 py-2 text-slate-200 hover:bg-zinc-800/70"
                    >
                      <span className="w-4 text-xs text-zinc-400">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {track.title}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Maybe You!
                        </p>
                      </div>
                      <span className="hidden text-xs text-zinc-400 sm:inline">
                        {track.plays}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {track.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discography */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Discography
                  </h2>
                  <button className="text-xs font-medium text-slate-300 hover:text-white">
                    Show all
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {/* All Songs card */}
                  <Link
                    href="/all-songs"
                    className="group cursor-pointer rounded-xl bg-zinc-900/60 p-3 transition hover:bg-zinc-800/80"
                  >
                    <div className="mb-3 aspect-square w-full overflow-hidden rounded-md bg-gradient-to-br from-emerald-500 via-fuchsia-500 to-sky-500 shadow-md shadow-black/40 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-50/90">
                      All Songs
                    </div>
                    <div className="space-y-0.5">
                      <p className="line-clamp-2 text-sm font-semibold text-white">
                        All Songs
                      </p>
                      <p className="text-xs text-zinc-400">Playlist</p>
                    </div>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
