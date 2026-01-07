export default function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6">
      {eyebrow && <div className="text-xs tracking-widest text-white/50">{eyebrow}</div>}
      <h2 className="mt-2 text-2xl md:text-3xl font-semibold">{title}</h2>
      {subtitle && <p className="mt-2 text-white/60 max-w-2xl">{subtitle}</p>}
    </div>
  );
}
