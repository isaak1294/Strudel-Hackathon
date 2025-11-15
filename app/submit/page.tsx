"use client";

import { useEffect, useState } from "react";

type Submission = {
    id: number;
    projectName: string;
    userName: string;
    projectUrl: string;
    imageUrl: string; // e.g. "/uploads/xyz.png"
};

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3002";

export default function Page() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadSubmissions() {
        try {
            setError(null);
            setLoading(true);
            console.log("Fetching submissions from", `${API_BASE}/api/submissions`);
            const res = await fetch(`${API_BASE}/api/submissions`, {
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`Failed to load submissions (${res.status})`);
            const data = (await res.json()) as Submission[];
            setSubmissions(data);
        } catch (err: any) {
            console.error("Error loading submissions:", err);
            setError(err.message || "Failed to load submissions");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSubmissions();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const res = await fetch(`${API_BASE}/api/submissions`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Submission failed");
            }

            form.reset();
            await loadSubmissions();
        } catch (err: any) {
            console.error("Error submitting:", err);
            setError(err.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-50">
            <div className="mx-auto max-w-5xl px-4 py-10">
                {/* Header */}
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                        Strudel Hackathon Gallery
                    </h1>
                    <p className="mt-2 text-sm text-slate-300 md:text-base">
                        Submit your project and see everyone&apos;s entries below.
                    </p>
                </header>

                {/* Layout: form + gallery */}
                <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)] items-start">
                    {/* Form card */}
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/50 backdrop-blur">
                        <h2 className="mb-3 text-lg font-semibold text-slate-100">
                            Submit your project
                        </h2>
                        <p className="mb-4 text-xs text-slate-400">
                            Required: project link, project name, your name/handle, and an
                            image (screenshot, cover art, etc.).
                        </p>

                        {error && (
                            <div className="mb-4 rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            encType="multipart/form-data"
                            className="space-y-4"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-200">
                                    Project Name
                                </label>
                                <input
                                    name="projectName"
                                    required
                                    type="text"
                                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-200">
                                    Your Name / Handle
                                </label>
                                <input
                                    name="userName"
                                    required
                                    type="text"
                                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-200">
                                    Project Link
                                </label>
                                <input
                                    name="projectUrl"
                                    required
                                    type="url"
                                    placeholder="https://..."
                                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-200">
                                    Image
                                </label>
                                <input
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    required
                                    className="w-full text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-500/90 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-50 hover:file:bg-indigo-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/60"
                            >
                                {submitting ? "Submitting..." : "Submit"}
                            </button>
                        </form>
                    </section>

                    {/* Gallery card */}
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/50 backdrop-blur">
                        <div className="mb-4 flex items-center justify-between gap-2">
                            <h2 className="text-lg font-semibold text-slate-100">
                                Submissions
                            </h2>
                            <button
                                onClick={loadSubmissions}
                                className="text-xs text-slate-300 underline-offset-2 hover:underline"
                            >
                                Refresh
                            </button>
                        </div>

                        {loading ? (
                            <p className="text-sm text-slate-300">Loading submissions…</p>
                        ) : submissions.length === 0 ? (
                            <p className="text-sm text-slate-300">
                                No submissions yet. Be the first!
                            </p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {submissions.map((s) => (
                                    <article
                                        key={s.id}
                                        className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 shadow-sm shadow-slate-900/40"
                                    >
                                        <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                                            <img
                                                src={`${API_BASE}${s.imageUrl}`}
                                                alt={s.projectName}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col px-3 py-3">
                                            <h3 className="line-clamp-2 text-sm font-semibold text-slate-50">
                                                {s.projectName}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-400">
                                                by {s.userName}
                                            </p>
                                            <a
                                                href={s.projectUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 inline-flex w-fit text-xs font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline"
                                            >
                                                View project
                                            </a>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
