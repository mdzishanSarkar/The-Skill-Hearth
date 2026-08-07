import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiUsers, FiMapPin, FiCalendar, FiVideo } from 'react-icons/fi';
import type { GroupSession } from '../../types/groupSession.types';

interface GroupSessionCardProps {
  session: GroupSession;
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-emerald-100 text-emerald-700',
  full: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
};

const FORMAT_ICONS: Record<string, typeof FiMapPin> = {
  'in-person': FiMapPin,
  online: FiVideo,
  either: FiUsers,
};

export default function GroupSessionCard({ session }: GroupSessionCardProps) {
  const teacher = session.teacherId;
  const skill = session.skillId;
  const spotsLeft = session.maxParticipants - session.participants.length;
  const FormatIcon = FORMAT_ICONS[session.format] || FiUsers;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[session.status] || STATUS_STYLES.open}`}>
            {session.status}
          </span>
          {session.sessionType === 'workshop' && (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
              Workshop
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        <Link to={`/group-sessions/${session._id}`} className="hover:text-indigo-600">
          {session.title}
        </Link>
      </h3>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{session.description}</p>

      <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-3">
        {skill && (
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">
            {skill.categoryName} / {skill.skillName}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">
          <FormatIcon className="h-3.5 w-3.5" />
          {session.format}
        </span>
        {session.scheduledAt && (
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">
            <FiCalendar className="h-3.5 w-3.5" />
            {new Date(session.scheduledAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2">
          {teacher && (
            <Link to={`/profile/${teacher._id}`} className="flex items-center gap-2 hover:text-indigo-600">
              {teacher.avatar ? (
                <img src={teacher.avatar} alt={teacher.displayName} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600">
                  {teacher.displayName[0]}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">{teacher.displayName}</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">
            <FiUsers className="inline h-3.5 w-3.5 mr-1" />
            {session.participants.length}/{session.maxParticipants}
          </span>
          {session.status === 'open' && spotsLeft > 0 && (
            <span className="text-emerald-600 font-medium">
              {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
            </span>
          )}
        </div>
      </div>

      {session.participants.length > 0 && (
        <div className="mt-3 flex -space-x-2">
          {session.participants.slice(0, 5).map((p) =>
            p.avatar ? (
              <img
                key={p._id}
                src={p.avatar}
                alt={p.displayName}
                className="h-7 w-7 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div
                key={p._id}
                className="h-7 w-7 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600"
              >
                {p.displayName[0]}
              </div>
            )
          )}
          {session.participants.length > 5 && (
            <div className="h-7 w-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
              +{session.participants.length - 5}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
