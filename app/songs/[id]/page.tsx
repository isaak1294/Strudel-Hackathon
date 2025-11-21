// app/songs/[id]/page.tsx

import { ProjectImage } from "@/app/components/ProjectImage";

type Submission = {
    id: number;
    projectName: string;
    userName: string;
    projectUrl: string;
    imageUrl: string;
};

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3002";

// Note: params is a Promise in newer Next versions
type SongPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function SongPage({ params }: SongPageProps) {
    const { id } = await params; // <-- unwrap the Promise first

    let submission: Submission | null = null;

    try {
        const res = await fetch(`${API_BASE}/api/submissions/${id}`, {
            cache: "no-store",
        });
        if (res.ok) {
            submission = (await res.json()) as Submission;
        } else {
            console.error("Failed to load submission", res.status);
        }
    } catch (err) {
        console.error("Error fetching submission:", err);
    }

    if (!submission) {
        return (
            <main className="min-h-screen bg-black text-white">
                <div className="mx-auto max-w-4xl px-4 py-10">
                    <a
                        href="/all-songs"
                        className="mb-6 inline-flex items-center text-sm text-slate-300 hover:text-white"
                    >
                        ← Back to All Songs
                    </a>
                    <p className="mt-4 text-sm text-slate-300">
                        Song not found. It may have been deleted or the link is invalid.
                    </p>
                </div>
            </main>
        );
    }

    const { projectName, userName, projectUrl, imageUrl } = submission;

    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-black to-black text-white">
            <div className="flex h-screen flex-col">
                {/* Top nav bar */}
                <header className="flex h-14 items-center justify-between px-4 text-sm text-slate-200 md:px-6">
                    <div className="flex items-center gap-2">
                        <a
                            href="/all-songs"
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
                    {/* Hero section */}
                    <section className="flex flex-col gap-6 px-4 pb-6 pt-6 md:flex-row md:items-start md:px-8 md:pb-10 md:pt-10">
                        {/* Cover / image */}
                        <ProjectImage imageUrl={imageUrl} projectName={projectName} API_BASE={API_BASE} />

                        {/* Text/meta */}
                        <div className="flex flex-1 flex-col justify-center gap-3 text-center md:text-left">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                                Song
                            </p>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                                {projectName}
                            </h1>
                            <p className="text-sm text-slate-200/90 md:text-base">
                                by <span className="font-medium text-white">{userName}</span>
                            </p>
                            {projectUrl && (
                                <p className="text-xs text-slate-400">
                                    Strudel link:{" "}
                                    <a
                                        href={projectUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline underline-offset-2 hover:text-emerald-300"
                                    >
                                        {projectUrl}
                                    </a>
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Strudel embed section */}
                    <section className="bg-gradient-to-b from-zinc-950/90 via-zinc-950 to-black px-4 pb-12 pt-4 md:px-8">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                            Strudel Project
                        </h2>

                        {projectUrl ? (
                            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black/70 shadow-lg shadow-black/50">
                                <iframe
                                    src={projectUrl}
                                    title={projectName}
                                    className="h-[420px] w-full"
                                    allow="autoplay; clipboard-write; encrypted-media"
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-slate-300">
                                No Strudel link for this song.
                            </p>
                        )}

                        <div className="mt-6 text-xs text-slate-400">
                            <p>
                                This page showcases the live-coded Strudel piece submitted by{" "}
                                <span className="font-semibold text-slate-200">{userName}</span>
                                . Use the embedded player above to explore their pattern.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
