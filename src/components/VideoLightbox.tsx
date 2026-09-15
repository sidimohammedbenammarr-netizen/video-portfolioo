"use client";

import { useEffect, useRef, useState } from "react";
import type { Video } from "@/lib/types";

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function VideoLightbox({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Lock page scroll, focus the dialog, restore on unmount.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === " " && document.activeElement?.tagName !== "BUTTON") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "ArrowRight") skip(5);
      if (e.key === "ArrowLeft") skip(-5);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }

  function skip(delta: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || 0);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const vol = Number(e.target.value);
    v.volume = vol;
    v.muted = vol === 0;
    setVolume(vol);
    setMuted(vol === 0);
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Playing ${video.title}`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm md:p-10"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={containerRef} className="relative flex w-full max-w-5xl flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-bronze2">{video.category}</p>
            <h2 className="font-display text-xl text-bone md:text-2xl">{video.title}</h2>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close video"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-bone transition-colors hover:border-bronze hover:text-bronze2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="relative overflow-hidden rounded-sm border border-line bg-black">
          {error ? (
            <div className="flex aspect-video flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm text-bone">This video couldn&apos;t be played.</p>
              <p className="text-xs text-muted">Check the video URL in the admin dashboard.</p>
            </div>
          ) : (
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-bone/20 border-t-bronze" />
                </div>
              )}
              <video
                ref={videoRef}
                src={video.video_url}
                className="aspect-video w-full bg-black"
                playsInline
                autoPlay
                onClick={togglePlay}
                onCanPlay={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              />

              {/* Controls */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-8">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={current}
                  onChange={handleSeek}
                  aria-label="Seek"
                  className="w-full accent-bronze"
                />
                <div className="flex items-center gap-4">
                  <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="text-bone hover:text-bronze2">
                    {playing ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <span className="text-xs tabular-nums text-muted">
                    {formatTime(current)} / {formatTime(duration)}
                  </span>

                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="text-bone hover:text-bronze2">
                      {muted || volume === 0 ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M4 9v6h4l5 5V4L8 9H4zM19 8l-4 4m0-4l4 4" stroke="currentColor" strokeWidth="1.6" fill="none" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M4 9v6h4l5 5V4L8 9H4zM16 8a5 5 0 010 8" stroke="currentColor" strokeWidth="1.6" fill="none" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={muted ? 0 : volume}
                      onChange={handleVolume}
                      aria-label="Volume"
                      className="w-20 accent-bronze"
                    />
                    <button onClick={toggleFullscreen} aria-label="Fullscreen" className="text-bone hover:text-bronze2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {(video.description || video.client) && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            {video.client && <span className="text-bone/80">Client: {video.client}</span>}
            {video.description && <span>{video.description}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
