import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from './useApiData.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const load = useCallback(() => getJson<LeaderboardResponse>('/api/leaderboard'), []);
  const state = useApiData(load);
  return <CapabilityCard title="Leaderboard" description="Compare team point totals.">
    {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
    {state.status === 'error' && <p role="alert">Unable to load leaderboard: {state.message}</p>}
    {state.status === 'success' && (state.data.leaderboard.length
      ? <ol className="list-group list-group-numbered">{state.data.leaderboard.map((entry) =>
        <li className="list-group-item d-flex justify-content-between" key={entry.rank}>
          <span>Rank {entry.rank}: {entry.teamName}</span><strong>{entry.totalPoints} points</strong>
        </li>)}</ol>
      : <p>No rankings yet.</p>)}
  </CapabilityCard>;
}
