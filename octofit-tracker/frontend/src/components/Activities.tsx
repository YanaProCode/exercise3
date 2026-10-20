import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from './useApiData.js';

type Activity = { _id?: string; type: string; minutes: number; points: number; occurredAt?: string };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const load = useCallback(() => getJson<ActivitiesResponse>('/api/activities'), []);
  const state = useApiData(load);
  return <CapabilityCard title="Activities" description="Track student activity minutes and points.">
    {state.status === 'loading' && <p role="status">Loading activities...</p>}
    {state.status === 'error' && <p role="alert">Unable to load activities: {state.message}</p>}
    {state.status === 'success' && (state.data.activities.length
      ? <ul className="list-group">{state.data.activities.map((activity, index) =>
        <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
          <strong>{activity.type}</strong> — {activity.minutes} minutes, {activity.points} points
        </li>)}</ul>
      : <p>No activities yet.</p>)}
  </CapabilityCard>;
}
