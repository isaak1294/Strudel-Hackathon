// app/all-songs/page.tsx
import Link from "next/link";

type Submission = {
    id: number;
    projectName: string;
    userName: string;
    projectUrl: string;
    imageUrl: string;
};

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3002";

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDuration(): string {
    const minutes = randomInt(2, 6);
    const seconds = randomInt(0, 59);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default async function AllSongsPage() {
    let submissions: Submission[] = [];

    try {
        const res = await fetch(`${API_BASE}/api/submissions`, {
            cache: "no-store",
        });
        if (res.ok) {
            submissions = (await res.json()) as Submission[];
        } else {
            console.error("Failed to load submissions", res.status);
        }
    } catch (err) {
        console.error("Error fetching submissions:", err);
    }

    const tracks = submissions.map((s) => ({
        id: s.id,
        title: s.projectName,
        artist: s.userName || "Strudel Collective",
        plays: randomInt(50_000, 1_500_000).toLocaleString("en-US"),
        duration: randomDuration(),
        projectUrl: s.projectUrl,
    }));

    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-800 via-zinc-900 to-black text-white">
            <div className="flex h-screen flex-col">
                {/* Top nav */}
                <header className="flex h-14 items-center justify-between px-4 text-sm text-slate-200 md:px-6">
                    <div className="flex items-center gap-2">
                        <a
                            href="/"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-slate-200 hover:bg-black"
                        >
                            {"<"}
                        </a>
                        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-slate-400 hover:bg-black">
                            {">"}
                        </button>
                    </div>
                </header>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Header */}
                    <section className="flex flex-col gap-4 px-4 pb-6 pt-6 md:flex-row md:items-end md:px-8 md:pb-8 md:pt-10">
                        <div className="flex justify-center md:justify-start">
                            <div className="h-40 w-40 rounded-md bg-gradient-to-br from-emerald-500 via-fuchsia-500 to-sky-500 shadow-2xl shadow-black md:h-56 md:w-56" />
                        </div>

                        <div className="mt-4 flex flex-1 flex-col justify-end gap-3 text-center md:mt-0 md:text-left">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                                Playlist
                            </p>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                                All Songs
                            </h1>
                            <p className="text-xs text-slate-200/90 md:text-sm">
                                Strudel Collective • {tracks.length}{" "}
                                {tracks.length === 1 ? "song" : "songs"}
                            </p>
                        </div>
                    </section>

                    {/* Controls + tracklist */}
                    <section className="bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-black px-4 pb-16 pt-4 md:px-8">
                        {/* Controls row */}
                        <div className="mb-6 flex items-center gap-5">
                            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-500/40 hover:scale-105 hover:bg-emerald-400">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-6 w-6 fill-black"
                                    aria-hidden="true"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </button>
                            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-500 text-zinc-300 hover:border-zinc-300 hover:text-white">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4 fill-current"
                                    aria-hidden="true"
                                >
                                    <path d="M12.1 4.44 12 4.55l-.1-.11C9.14 1.39 4.6 2.35 3.07 5.28c-1.2 2.3-.5 5.24 1.67 6.87L12 20l7.26-7.85c2.17-1.63 2.87-4.57 1.67-6.87C19.4 2.35 14.86 1.39 12.1 4.44z" />
                                </svg>
                            </button>
                            <button className="text-2xl text-zinc-400">•••</button>
                        </div>

                        {tracks.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-300">
                                No songs yet. Once participants submit their projects, they’ll
                                appear here.
                            </p>
                        ) : (
                            <>
                                {/* Tracklist header */}
                                <div className="mb-2 grid grid-cols-[auto_minmax(0,4fr)_minmax(0,3fr)_auto] items-center gap-3 border-b border-zinc-800 pb-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
                                    <span className="w-6 text-center text-xs">#</span>
                                    <span className="text-xs">Title</span>
                                    <span className="hidden text-xs sm:inline">Plays</span>
                                    <span className="text-right text-xs">Time</span>
                                </div>

                                {/* Tracklist rows */}
                                <div className="space-y-1 text-sm">
                                    {tracks.map((track, idx) => (
                                        <Link
                                            href={`/songs/${track.id}`}
                                            key={track.id}
                                            className="grid cursor-pointer grid-cols-[auto_minmax(0,4fr)_minmax(0,3fr)_auto] items-center gap-3 rounded-md px-2 py-2 text-slate-200 hover:bg-zinc-800/70"
                                        >
                                            <span className="w-6 text-center text-xs text-zinc-400">
                                                {idx + 1}
                                            </span>
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-sm text-white">
                                                    {track.title}
                                                </span>
                                                <span className="text-xs text-zinc-400">
                                                    {track.artist}
                                                </span>
                                            </div>
                                            <span className="hidden text-xs text-zinc-400 sm:inline">
                                                {track.plays}
                                            </span>
                                            <span className="text-right text-xs text-zinc-400">
                                                {track.duration}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
