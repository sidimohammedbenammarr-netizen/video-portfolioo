export const metadata = { title: "About — Sidi Mohammed" };

const SKILLS = [
  "Narrative pacing & story structure",
  "Color grading & correction",
  "Sound design & mixing",
  "Motion graphics & kinetic type",
  "Multi-camera sync & editing",
  "Short-form hooks for social",
];

const SOFTWARE = [
  "Adobe Premiere Pro",
  "After Effects",
  "DaVinci Resolve",
  "Photoshop",
  "Audition",
];

const PROJECT_TYPES = [
  "Instagram / TikTok reels",
  "Paid social & app-store ads",
  "YouTube long-form & vlogs",
  "Motion graphics & titles",
  "Brand & product videos",
];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-content px-6 py-20 md:px-10 md:py-28">
      <div className="grid gap-16 md:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-sm text-bronze2">About</p>
          <h1 className="mt-3 font-display text-4xl font-light leading-tight text-bone md:text-5xl">
            Editing that respects your audience&apos;s attention.
          </h1>
          <p className="mt-6 text-muted leading-relaxed">
            I&apos;m Sidi Mohammed, a freelance video editor. I turn raw footage into
            edits that hold attention from the first frame — whether that&apos;s
            a fifteen-second hook or a ten-minute YouTube video. I work directly
            with brands, creators and small agencies, usually joining after
            filming to handle the entire post-production process.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <h2 className="mb-4 font-display text-xl text-bone">Skills</h2>
            <ul className="space-y-2.5 text-sm text-muted">
              {SKILLS.map((s) => (
                <li key={s} className="border-l border-line pl-3">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 font-display text-xl text-bone">Software</h2>
            <ul className="space-y-2.5 text-sm text-muted">
              {SOFTWARE.map((s) => (
                <li key={s} className="border-l border-line pl-3">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-2">
            <h2 className="mb-4 font-display text-xl text-bone">
              Projects I edit
            </h2>
            <ul className="grid gap-2.5 text-sm text-muted sm:grid-cols-2">
              {PROJECT_TYPES.map((s) => (
                <li key={s} className="border-l border-line pl-3">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
