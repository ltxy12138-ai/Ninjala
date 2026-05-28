type FeatureCardProps = {
  title: string;
  description: string;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
      <h2 className="text-lg font-semibold text-[#183a2a]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#55715f]">{description}</p>
    </section>
  );
}
