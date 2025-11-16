"use client";

import { useState } from "react";
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

export default function SubmitPage() {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

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
            setSuccess("Submission received! Check the All Songs page to see it.");
        } catch (err: any) {
            console.error("Error submitting:", err);
            setError(err.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    }

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
                    {/* Top bar */}
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
                        <div className="mx-auto flex max-w-3xl flex-col px-4 pb-12 pt-8 md:pt-10">
                            {/* Page header */}
                            <div className="mb-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                                    Strudel Hackathon
                                </p>
                                <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                                    Submit your project
                                </h1>
                                <p className="mt-2 text-sm text-slate-300 md:text-base">
                                    Share your Strudel link, project name, your handle, and an
                                    image. Your piece will appear in the All Songs playlist and
                                    get its own song page.
                                </p>
                            </div>

                            {/* Form card */}
                            <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/60 backdrop-blur">
                                <p className="mb-4 text-xs text-slate-400">
                                    Make sure your project link points to your Strudel project
                                    (e.g. a <span className="font-mono">strudel.cc</span> URL).
                                </p>

                                {error && (
                                    <div className="mb-4 rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
                                        {success}
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
                                            className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
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
                                            className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-200">
                                            Strudel Project Link
                                        </label>
                                        <input
                                            name="projectUrl"
                                            required
                                            type="url"
                                            placeholder="https://strudel.cc/..."
                                            className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-200">
                                            Image (screenshot / cover art)
                                        </label>
                                        <input
                                            name="image"
                                            type="file"
                                            accept="image/*"
                                            required
                                            className="w-full text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/90 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-50 hover:file:bg-emerald-400"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="inline-flex items-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
                                    >
                                        {submitting ? "Submitting..." : "Submit project"}
                                    </button>
                                </form>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
