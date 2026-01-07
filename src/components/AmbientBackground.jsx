export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* base */}
      <div className="absolute inset-0 bg-[#070A12]" />

      {/* ambient blobs */}
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="absolute top-20 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="absolute bottom-[-220px] left-1/3 h-[620px] w-[620px] rounded-full bg-indigo-500/15 blur-3xl" />

      {/* subtle noise-like overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-black/40" />
    </div>
  );
}
