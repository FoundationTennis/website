import type { Session } from '../../types/booking';

interface ProgramCardProps {
  session: Session;
  onSelect: (session: Session) => void;
}

function getAvailabilityColor(spots: number): string {
  if (spots === 0) return 'border-red-500 bg-red-50';
  if (spots <= 2) return 'border-yellow-500 bg-yellow-50';
  return 'border-green-500 bg-green-50';
}

function getAvailabilityBadge(spots: number): { text: string; className: string } {
  if (spots === 0) {
    return { text: 'Full', className: 'bg-red-100 text-red-800' };
  }
  if (spots <= 2) {
    return { text: `${spots} spot${spots === 1 ? '' : 's'} left`, className: 'bg-yellow-100 text-yellow-800' };
  }
  return { text: `${spots} spots available`, className: 'bg-green-100 text-green-800' };
}

function getProgramTypeColor(type: string): string {
  switch (type) {
    case 'blue_ball':
      return 'bg-[#3498DB]';
    case 'red_ball':
      return 'bg-[#E74C3C]';
    case 'orange_ball':
      return 'bg-[#F39C12]';
    case 'green_ball':
      return 'bg-[#27AE60]';
    case 'yellow_ball':
      return 'bg-[#F1C40F]';
    case 'development':
      return 'bg-[#6366F1]';
    default:
      return 'bg-gray-500';
  }
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProgramCard({ session, onSelect }: ProgramCardProps) {
  const { program, available_spots } = session;
  const availabilityColor = getAvailabilityColor(available_spots);
  const badge = getAvailabilityBadge(available_spots);
  const typeColor = getProgramTypeColor(program.program_type);
  const isDisabled = available_spots === 0;

  return (
    <div
      className={`rounded-lg border-2 p-4 transition-shadow hover:shadow-md ${availabilityColor} ${
        isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={() => !isDisabled && onSelect(session)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${typeColor}`} />
          <h3 className="font-semibold text-[--color-text]">{program.name}</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.className}`}>
          {badge.text}
        </span>
      </div>

      {/* Description */}
      {program.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {program.description}
        </p>
      )}

      {/* Age Range */}
      {(program.min_age || program.max_age) && (
        <div className="text-sm text-gray-500 mb-2">
          Ages: {program.min_age || 0} - {program.max_age || '18+'}
        </div>
      )}

      {/* Time */}
      <div className="text-sm text-gray-600 mb-3">
        {session.start_time} - {session.end_time}
        {session.location && <span className="ml-2 text-gray-400">| {session.location}</span>}
      </div>

      {/* Pricing */}
      <div className="border-t pt-3 mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-[--color-text]">
            {formatPrice(program.price_cents)}
          </span>
          <span className="text-sm text-gray-500">/ term</span>
        </div>
      </div>

      {/* Select Button */}
      {!isDisabled && (
        <button
          className="w-full mt-4 bg-[--color-primary] text-white py-2 rounded-lg hover:opacity-90 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(session);
          }}
        >
          Select Program
        </button>
      )}
    </div>
  );
}
