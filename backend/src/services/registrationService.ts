import prisma from '../db';
import AppError from '../lib/AppError';
import hubspot from '../hubspot';
import type { RegistrationResult } from '../types/hubspot';

function ensureHubSpot(): void {
  if (!hubspot.apiKey) {
    throw new AppError(503, 'HubSpot API key not configured. Please set HUBSPOT_API_KEY.');
  }
}

function filterShiftCodes(courseCodes: string[], shift: string): string[] {
  const shiftSpecific: string[] = [];
  const neutral: string[] = [];

  for (const code of courseCodes) {
    const upper = code.toUpperCase();
    const isAM = upper.includes('-AM') || upper.includes('_AM');
    const isPM = upper.includes('-PM') || upper.includes('_PM');

    if (isAM || isPM) {
      if (shift === 'AM' && isAM) shiftSpecific.push(code);
      if (shift === 'PM' && isPM) shiftSpecific.push(code);
    } else {
      neutral.push(code);
    }
  }

  // Neutral codes (no shift indicator, e.g. deposit codes) go to PM only
  if (shift === 'PM') return [...shiftSpecific, ...neutral];
  return shiftSpecific;
}

async function getRegistrationList(
  cycleId: number,
  shift: string,
  refresh: boolean,
): Promise<RegistrationResult> {
  ensureHubSpot();

  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new AppError(404, 'Cycle not found.');

  const courseCodes: string[] = cycle.courseCodes
    ? (JSON.parse(cycle.courseCodes) as string[])
    : [];
  if (courseCodes.length === 0) {
    return {
      rows: [],
      meta: { totalStudents: 0, shift, fetchedAt: new Date().toISOString(), noCodes: true },
    };
  }

  const codesToUse = filterShiftCodes(courseCodes, shift);
  const cacheKey = `${cycleId}_${shift}`;

  if (refresh) {
    hubspot.clearRegistrationCache(cacheKey);
  }

  return hubspot.buildRegistrationList(codesToUse, shift, cacheKey) as Promise<RegistrationResult>;
}

async function exportRegistrationCsv(cycleId: number, shift: string) {
  ensureHubSpot();

  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new AppError(404, 'Cycle not found.');

  const courseCodes: string[] = cycle.courseCodes
    ? (JSON.parse(cycle.courseCodes) as string[])
    : [];
  if (courseCodes.length === 0) {
    throw new AppError(400, 'No course codes configured for this cycle.');
  }

  const codesToUse = filterShiftCodes(courseCodes, shift);
  const cacheKey = `${cycleId}_${shift}`;
  const result = (await hubspot.buildRegistrationList(
    codesToUse,
    shift,
    cacheKey,
  )) as RegistrationResult;

  const headers = [
    'Seat #',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Student ID',
    'Course Start Date',
    'Course End Date',
    'Registration Date',
    'Payment Status',
    'Outstanding',
    'Cycle Count',
    'Roadmap',
    'AFK',
    'ACJ',
    'Exam Date',
  ];

  const csvRows = [headers.join(',')];
  for (const row of result.rows) {
    csvRows.push(
      [
        row.seatNumber,
        `"${(row.firstName || '').replace(/"/g, '""')}"`,
        `"${(row.lastName || '').replace(/"/g, '""')}"`,
        `"${(row.email || '').replace(/"/g, '""')}"`,
        `"${(row.phone || '').replace(/"/g, '""')}"`,
        `"${(row.studentId || '').replace(/"/g, '""')}"`,
        row.courseStartDate ? new Date(row.courseStartDate).toLocaleDateString('en-US') : '',
        row.courseEndDate ? new Date(row.courseEndDate).toLocaleDateString('en-US') : '',
        row.registrationDate ? new Date(row.registrationDate).toLocaleDateString('en-US') : '',
        `"${(row.paymentStatus || '').replace(/"/g, '""')}"`,
        row.outstanding || 0,
        row.cycleCount || 0,
        row.hasRoadmap ? 'Yes' : 'No',
        row.hasAFK ? 'Yes' : 'No',
        row.hasACJ ? 'Yes' : 'No',
        row.examDate ? new Date(row.examDate).toLocaleDateString('en-US') : '',
      ].join(','),
    );
  }

  return {
    csv: csvRows.join('\n'),
    cycleName: (cycle.name || `cycle-${cycleId}`).replace(/\s+/g, '-'),
  };
}

export { getRegistrationList, exportRegistrationCsv };
