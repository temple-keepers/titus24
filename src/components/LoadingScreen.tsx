export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: 'var(--gradient-body)' }}
    >
      <div className="mb-8">
        <img
          src="/logo.png"
          alt="Titus 2:4 Logo"
          className="w-24 h-24 object-contain animate-pulse-soft"
          style={{ filter: 'drop-shadow(0 0 40px rgba(232, 102, 138, 0.2))' }}
        />
      </div>
      <h1 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        Titus 2:4 Company
      </h1>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Loading your community…
      </p>
    </div>
  );
}
