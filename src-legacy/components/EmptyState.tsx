interface Props {
  message?: string;
}

export default function EmptyState({ message = 'Nothing here yet' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--color-border)' }}
      >
        <span className="text-2xl opacity-60">✦</span>
      </div>
      <p className="font-display text-base italic" style={{ color: 'var(--color-text-faint)' }}>
        {message}
      </p>
    </div>
  );
}
