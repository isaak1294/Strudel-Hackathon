"use client";

import { useState } from "react";

type Props = {
    imageUrl: string | null;
    projectName: string;
    API_BASE: string;
};

export function ProjectImage({ imageUrl, projectName, API_BASE }: Props) {
    const [imgError, setImgError] = useState(false);

    const hasImage = imageUrl && !imgError;

    return (
        <div className="flex justify-center md:justify-start">
            <div className="relative h-40 w-40 overflow-hidden rounded-md bg-zinc-900 shadow-2xl shadow-black md:h-56 md:w-56">
                {hasImage ? (
                    <img
                        src={`${API_BASE}${imageUrl}`}
                        alt={projectName}
                        className="h-full w-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-emerald-500 via-fuchsia-500 to-sky-500" />
                )}
            </div>
        </div>
    );
}
