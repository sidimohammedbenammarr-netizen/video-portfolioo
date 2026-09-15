export const metadata = { title: "Contact — Sidi Mohammed" };

const LINKS = [
  {
    label: "Email",
    value: "sidi.mohammed.benammarr@gmail.com",
    href: "mailto:sidi.mohammed.benammarr@gmail.com",
  },
  {
    label: "Instagram",
    value: "@_.sdimohammed.edit",
    href: "https://www.instagram.com/_.sdimohammed.edit/",
  },
  {
    label: "WhatsApp",
    value: "+213 562 88 35 89",
    href: "https://wa.me/213562883589",
  },
];

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-content px-6 py-20 md:px-10 md:py-28">
      <div className="max-w-2xl">
        <p className="text-sm text-bronze2">Contact</p>
        <h1 className="mt-3 font-display text-4xl font-light text-bone md:text-5xl">
          Have footage that needs a cut?
        </h1>
        <p className="mt-4 text-muted">
          Tell me about your project — the platform it&apos;s for, roughly how
          long it needs to be, and your timeline. I usually reply within a day.
        </p>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="group min-w-0 rounded-sm border border-line p-6 transition-colors hover:border-bronze/70"
          >
            <p className="text-xs text-muted">{link.label}</p>
            <p className="mt-2 break-words text-bone group-hover:text-bronze2">
              {link.value}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
