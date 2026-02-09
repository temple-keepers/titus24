export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: 'var(--gradient-body)' }}
    >
      <div className="relative mb-8">
        <div
          className="w-20 h-20 rounded-full animate-pulse-soft"
          style={{
            background: 'var(--gradient-brand)',
            boxShadow: '0 0 40px rgba(232, 102, 138, 0.2)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-2xl font-display font-bold">T</span>
        </div>
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
