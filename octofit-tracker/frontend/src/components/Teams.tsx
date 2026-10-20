import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from './useApiData.js';

type Team = { _id?: string; name: string; mascot?: string; members: unknown[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const load = useCallback(() => getJson<TeamsResponse>('/api/teams'), []);
  const state = useApiData(load);
  return <CapabilityCard title="Teams" description="Manage teams and members.">
    {state.status === 'loading' && <p role="status">Loading teams...</p>}
    {state.status === 'error' && <p role="alert">Unable to load teams: {state.message}</p>}
    {state.status === 'success' && (state.data.teams.length
      ? <ul className="list-group">{state.data.teams.map((team, index) =>
        <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
          <strong>{team.name}</strong>{team.mascot ? ` — ${team.mascot}` : ''} ({team.members.length} members)
        </li>)}</ul>
      : <p>No teams yet.</p>)}
  </CapabilityCard>;
}
