import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from './useApiData.js';

type WorkoutSuggestion = { _id?: string; title: string; focus?: string; minutes?: number; reason?: string };
type SuggestionsResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const load = useCallback(() => getJson<SuggestionsResponse>('/api/workouts/suggestions/mona%40example.com'), []);
  const state = useApiData(load);
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
    {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
    {state.status === 'error' && <p role="alert">Unable to load workout suggestions: {state.message}</p>}
    {state.status === 'success' && (state.data.suggestions.length
      ? <ul className="list-group">{state.data.suggestions.map((workout, index) =>
        <li className="list-group-item" key={workout._id ?? `${workout.title}-${index}`}>
          <strong>{workout.title}</strong>
          {workout.focus && <span> — {workout.focus}</span>}
          {workout.minutes !== undefined && <span> ({workout.minutes} minutes)</span>}
          {workout.reason && <p className="mb-0">{workout.reason}</p>}
        </li>)}</ul>
      : <p>No workout suggestions available.</p>)}
  </CapabilityCard>;
}
