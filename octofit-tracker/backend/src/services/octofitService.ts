import { Activity, Team, User, Workout } from '../models/index.js';

type ActivityInput = {
  userId: string;
  teamId: string;
  type: string;
  minutes: number;
};

type TeamInput = {
  name: string;
  mascot: string;
  members?: string[];
};

type HttpError = Error & { status: number };

function httpError(status: number, message: string): HttpError {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[\da-f]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw httpError(400, 'Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw httpError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) throw httpError(404, 'User or team was not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team details are required');
  const { name, mascot } = input;
  const members = input.members === undefined ? [] : input.members;
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError(400, 'Team mascot is required');
  if (!Array.isArray(members) || !members.every(isObjectId)) {
    throw httpError(400, 'Team members must be valid user IDs');
  }
  if (members.length) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== members.length) throw httpError(400, 'One or more team members were not found');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

function focusForActivity(type: string): string | undefined {
  const focusByType: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    strength: 'strength',
    walk: 'mobility',
  };
  return focusByType[type.toLowerCase()];
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError(404, 'User was not found');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus = recentActivity ? focusForActivity(recentActivity.type) : undefined;
  const focus = activityFocus ?? user.fitnessGoal;
  const matchingWorkouts = await Workout.find({ focus }).sort({ minutes: 1, title: 1 }).lean();
  const workouts = matchingWorkouts.length
    ? matchingWorkouts
    : await Workout.find().sort({ focus: 1, title: 1 }).lean();
  const reason = activityFocus
    ? `Recommended because your recent ${recentActivity?.type} activity supports ${focus}.`
    : `Recommended to support your ${user.fitnessGoal} fitness goal.`;

  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
