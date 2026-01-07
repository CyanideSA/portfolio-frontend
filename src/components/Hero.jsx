export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0f1a] to-[#12172a]">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white">
          Hi, I’m <span className="text-indigo-400">Suvo Ahmed</span>
        </h1>
        <p className="mt-4 text-gray-400 text-xl">
          Full Stack Developer • Spring Boot • React
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <a className="px-6 py-3 bg-indigo-500 rounded-xl text-white hover:scale-105 transition">
            View Projects
          </a>
          <a className="px-6 py-3 border border-indigo-400 rounded-xl text-indigo-300 hover:bg-indigo-500/10">
            Contact Me
          </a>
        </div>
      </div>
    </section>
  );
}
