import GlassCard from "./GlassCard.jsx";

export default function ProjectCard({ project }) {
  return (
    <GlassCard className="p-5 hover:bg-white/[0.07] transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{project.title}</h3>
          <p className="mt-2 text-white/60">{project.description}</p>
        </div>
      </div>

      {project.techStack && (
        <div className="mt-4 text-xs text-white/60">
          <span className="text-white/40">Tech:</span> {project.techStack}
        </div>
      )}

      <div className="mt-5 flex gap-3">
        {project.githubUrl && (
          <a className="text-sm text-cyan-300 hover:text-cyan-200" href={project.githubUrl} target="_blank">
            GitHub →
          </a>
        )}
        {project.liveUrl && (
          <a className="text-sm text-fuchsia-300 hover:text-fuchsia-200" href={project.liveUrl} target="_blank">
            Live →
          </a>
        )}
      </div>
    </GlassCard>
  );
}
