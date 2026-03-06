import LeaderboardTable from '@/components/Leaderboard';

export const metadata = {
  title: 'Leaderboard — Speed Arena',
};

export default function LeaderboardPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-arena-white mb-2">Leaderboard</h1>
        <p className="font-mono text-sm text-dim">
          Aggregate stats from all races run on this device.
        </p>
      </div>
      <LeaderboardTable />
    </main>
  );
}
