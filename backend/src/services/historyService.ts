import prisma from '../db';
import type { HistoryCycleGroup, HistoryBookingEntry } from '../types';

interface HistoryParams {
  contactId?: string;
  name?: string;
}

async function getStudentHistory({ contactId, name }: HistoryParams): Promise<HistoryCycleGroup[]> {
  const where: Record<string, unknown> = {};
  if (contactId) {
    where.contactId = contactId;
  } else if (name) {
    where.traineeName = { contains: name };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      station: {
        include: { lab: true },
      },
      cycle: {
        include: { cycleWeeks: true },
      },
    },
    orderBy: [{ cycle: { year: 'desc' } }, { cycle: { number: 'desc' } }, { week: 'asc' }],
  });

  const cycleMap = new Map<number, HistoryCycleGroup>();

  for (const booking of bookings) {
    const cycleId = booking.cycle.id;

    if (!cycleMap.has(cycleId)) {
      cycleMap.set(cycleId, {
        cycle: {
          id: booking.cycle.id,
          name: booking.cycle.name,
          year: booking.cycle.year,
          number: booking.cycle.number,
        },
        bookings: [],
      });
    }

    const cycleWeek = booking.cycle.cycleWeeks.find((cw) => cw.week === booking.week);

    const entry: HistoryBookingEntry = {
      lab: booking.station.lab.name,
      stationNumber: booking.station.number,
      side: booking.station.side,
      shift: booking.shift,
      week: booking.week,
      startDate: cycleWeek?.startDate?.toISOString() ?? null,
      endDate: cycleWeek?.endDate?.toISOString() ?? null,
    };

    cycleMap.get(cycleId)!.bookings.push(entry);
  }

  return Array.from(cycleMap.values());
}

export { getStudentHistory };
