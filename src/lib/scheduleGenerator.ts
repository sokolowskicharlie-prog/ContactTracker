import { Contact, ContactWithActivity, CallSchedule } from './supabase';

// Timezone data with business hours (using GMT offset format from database)
const TIMEZONE_DATA = {
  'GMT+0': { offset: '+00:00', endOfBusiness: 17, label: 'GMT+0' },
  'GMT+1': { offset: '+01:00', endOfBusiness: 18, label: 'GMT+1' },
  'GMT+2': { offset: '+02:00', endOfBusiness: 18, label: 'GMT+2' },
  'GMT+3': { offset: '+03:00', endOfBusiness: 18, label: 'GMT+3' },
  'GMT+4': { offset: '+04:00', endOfBusiness: 18, label: 'GMT+4' },
  'GMT+5:30': { offset: '+05:30', endOfBusiness: 18, label: 'GMT+5:30' },
  'GMT+7': { offset: '+07:00', endOfBusiness: 18, label: 'GMT+7' },
  'GMT+8': { offset: '+08:00', endOfBusiness: 18, label: 'GMT+8' },
  'GMT+9': { offset: '+09:00', endOfBusiness: 18, label: 'GMT+9' },
  'GMT+10': { offset: '+10:00', endOfBusiness: 18, label: 'GMT+10' },
  'GMT+12': { offset: '+12:00', endOfBusiness: 17, label: 'GMT+12' },
  'GMT-3': { offset: '-03:00', endOfBusiness: 17, label: 'GMT-3' },
  'GMT-4': { offset: '-04:00', endOfBusiness: 17, label: 'GMT-4' },
  'GMT-5': { offset: '-05:00', endOfBusiness: 17, label: 'GMT-5' },
  'GMT-6': { offset: '-06:00', endOfBusiness: 17, label: 'GMT-6' },
  'GMT-8': { offset: '-08:00', endOfBusiness: 17, label: 'GMT-8' },
};

export type PriorityLabel = 'Warm' | 'Follow-Up' | 'High Value' | 'Cold';

export interface ScheduleParams {
  totalCalls: number;
  deadlineGMT: string;
  callDurationMins: number;
  fillRestOfDay?: boolean;
  timezoneDistribution?: Record<string, number>;
  priorityDistribution?: Record<PriorityLabel, number>;
  statusFilters?: ('none' | 'jammed' | 'traction' | 'client')[];
}

export interface SuggestedContact {
  contact?: Contact | ContactWithActivity;
  contactName: string;
  priorityLabel: PriorityLabel;
  timezoneLabel: string;
  reason: string;
}

export function analyzeContactPriority(contact: Contact | ContactWithActivity): PriorityLabel {
  const now = new Date();
  const hasActivity = 'total_calls' in contact;

  if (hasActivity) {
    const c = contact as ContactWithActivity;

    // Warm: Recent activity (within 7 days)
    if (c.last_call_date || c.last_email_date) {
      const lastContact = new Date(
        Math.max(
          c.last_call_date ? new Date(c.last_call_date).getTime() : 0,
          c.last_email_date ? new Date(c.last_email_date).getTime() : 0
        )
      );
      const daysSince = (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince <= 7) {
        return 'Warm';
      }
    }

    // High Value: Has deals or is a client
    if (c.total_deals > 0 || contact.is_client) {
      return 'High Value';
    }

    // Follow-Up: Has overdue tasks or no contact in 30+ days
    if (c.is_overdue || c.pending_tasks > 0) {
      return 'Follow-Up';
    }

    if (c.last_call_date || c.last_email_date) {
      const lastContact = new Date(
        Math.max(
          c.last_call_date ? new Date(c.last_call_date).getTime() : 0,
          c.last_email_date ? new Date(c.last_email_date).getTime() : 0
        )
      );
      const daysSince = (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince >= 30) {
        return 'Follow-Up';
      }
    }
  }

  // Cold: New or no recent activity
  return 'Cold';
}

export function getTimezoneEndOfBusinessGMT(timezone: string, date: Date = new Date()): Date {
  const tzData = TIMEZONE_DATA[timezone as keyof typeof TIMEZONE_DATA];
  if (!tzData) return new Date(date.setHours(17, 0, 0, 0));

  const endOfBusiness = new Date(date);
  endOfBusiness.setHours(tzData.endOfBusiness, 0, 0, 0);

  // Convert to GMT
  const offsetHours = parseInt(tzData.offset.split(':')[0]);
  const offsetMins = parseInt(tzData.offset.split(':')[1]);
  endOfBusiness.setHours(endOfBusiness.getHours() - offsetHours);
  endOfBusiness.setMinutes(endOfBusiness.getMinutes() - offsetMins);

  return endOfBusiness;
}

function convertGMTToLocalTime(gmtTime: Date, timezone: string): Date {
  const tzData = TIMEZONE_DATA[timezone as keyof typeof TIMEZONE_DATA];
  if (!tzData) return new Date(gmtTime);

  const localTime = new Date(gmtTime);
  const offsetHours = parseInt(tzData.offset.split(':')[0]);
  const offsetMins = parseInt(tzData.offset.split(':')[1]);

  localTime.setHours(localTime.getHours() + offsetHours);
  localTime.setMinutes(localTime.getMinutes() + offsetMins);

  return localTime;
}

function isWithinBusinessHours(gmtTime: Date, timezone: string): boolean {
  const localTime = convertGMTToLocalTime(gmtTime, timezone);
  const hours = localTime.getHours();
  const minutes = localTime.getMinutes();

  const timeInMinutes = hours * 60 + minutes;
  const startOfDay = 9 * 60;
  const endOfDay = 17 * 60;

  return timeInMinutes >= startOfDay && timeInMinutes < endOfDay;
}

function getNextAvailableSlot(currentGMT: Date, timezone: string, callDurationMins: number): Date | null {
  const localTime = convertGMTToLocalTime(currentGMT, timezone);
  const hours = localTime.getHours();
  const minutes = localTime.getMinutes();

  const timeInMinutes = hours * 60 + minutes;
  const startOfDay = 9 * 60;
  const endOfDay = 17 * 60;

  if (timeInMinutes < startOfDay) {
    const tzData = TIMEZONE_DATA[timezone as keyof typeof TIMEZONE_DATA];
    if (!tzData) return null;

    const nextSlot = new Date(localTime);
    nextSlot.setHours(9, 0, 0, 0);

    const offsetHours = parseInt(tzData.offset.split(':')[0]);
    const offsetMins = parseInt(tzData.offset.split(':')[1]);
    nextSlot.setHours(nextSlot.getHours() - offsetHours);
    nextSlot.setMinutes(nextSlot.getMinutes() - offsetMins);

    return nextSlot;
  }

  if (timeInMinutes + callDurationMins > endOfDay) {
    return null;
  }

  return currentGMT;
}

export function suggestContacts(
  contacts: (Contact | ContactWithActivity)[],
  count: number,
  priorityLabel: PriorityLabel
): SuggestedContact[] {
  const filtered = contacts.filter(c => analyzeContactPriority(c) === priorityLabel);

  // Sort by relevance
  const sorted = filtered.sort((a, b) => {
    if (priorityLabel === 'Warm' || priorityLabel === 'Follow-Up') {
      // For warm/follow-up, prioritize recent activity
      const aTime = 'last_call_date' in a ? new Date(a.last_call_date || 0).getTime() : 0;
      const bTime = 'last_call_date' in b ? new Date(b.last_call_date || 0).getTime() : 0;
      return bTime - aTime;
    } else if (priorityLabel === 'High Value') {
      // For high value, prioritize clients and those with deals
      const aScore = (a.is_client ? 10 : 0) + ('total_deals' in a ? a.total_deals : 0);
      const bScore = (b.is_client ? 10 : 0) + ('total_deals' in b ? b.total_deals : 0);
      return bScore - aScore;
    }
    return 0;
  });

  return sorted.slice(0, count).map(c => ({
    contact: c,
    contactName: c.name || c.company || 'Unknown',
    priorityLabel,
    timezoneLabel: getTimezoneLabel(c.timezone),
    reason: getReasonText(c, priorityLabel)
  }));
}

function getTimezoneLabel(timezone?: string): string {
  if (!timezone) return 'Unknown';
  const tzData = TIMEZONE_DATA[timezone as keyof typeof TIMEZONE_DATA];
  return tzData?.label || timezone;
}

function getReasonText(contact: Contact | ContactWithActivity, priority: PriorityLabel): string {
  if (priority === 'Warm') {
    return 'Recent activity';
  } else if (priority === 'Follow-Up') {
    if ('is_overdue' in contact && contact.is_overdue) {
      return 'Overdue follow-up';
    }
    return 'Needs follow-up';
  } else if (priority === 'High Value') {
    if (contact.is_client) {
      return 'Existing client';
    }
    return 'Strategic target';
  }
  return 'New prospect';
}

export function generateCallSchedule(
  params: ScheduleParams,
  contacts: (Contact | ContactWithActivity)[],
  userId: string,
  goalId: string
): Omit<CallSchedule, 'id' | 'created_at' | 'updated_at'>[] {
  const { totalCalls, deadlineGMT, callDurationMins, fillRestOfDay, statusFilters } = params;

  const deadline = new Date(deadlineGMT);
  const now = new Date();

  // Calculate actual number of calls based on fillRestOfDay option
  let targetCalls = totalCalls;
  if (fillRestOfDay) {
    const timeAvailable = deadline.getTime() - now.getTime();
    const callIntervalMs = callDurationMins * 60 * 1000;
    targetCalls = Math.floor(timeAvailable / callIntervalMs);
  }

  // Start from current time
  let currentTime = new Date(now);

  // Filter contacts by status if filters are provided
  let activeContacts = contacts;
  if (statusFilters && statusFilters.length > 0) {
    activeContacts = contacts.filter(c => {
      if (c.is_jammed && statusFilters.includes('jammed')) return true;
      if (c.is_client && !c.is_jammed && statusFilters.includes('client')) return true;
      if (c.has_traction && !c.is_jammed && !c.is_client && statusFilters.includes('traction')) return true;
      if (!c.is_jammed && !c.is_client && !c.has_traction && statusFilters.includes('none')) return true;
      return false;
    });
  } else {
    // Default: filter out jammed contacts
    activeContacts = contacts.filter(c => !c.is_jammed);
  }

  // Group contacts by timezone and filter by current business hours
  const contactsByTimezone: Record<string, (Contact | ContactWithActivity)[]> = {};
  activeContacts.forEach(c => {
    const tz = c.timezone || 'GMT+0';

    // Only include contacts if their current local time is between 9 AM - 5 PM
    if (!isWithinBusinessHours(now, tz)) {
      return;
    }

    if (!contactsByTimezone[tz]) {
      contactsByTimezone[tz] = [];
    }
    contactsByTimezone[tz].push(c);
  });

  const timezonePriority = Object.keys(contactsByTimezone).sort((a, b) => {
    const aWithinHours = isWithinBusinessHours(now, a);
    const bWithinHours = isWithinBusinessHours(now, b);

    if (aWithinHours && !bWithinHours) return -1;
    if (!aWithinHours && bWithinHours) return 1;

    const aEnd = getTimezoneEndOfBusinessGMT(a);
    const bEnd = getTimezoneEndOfBusinessGMT(b);
    return aEnd.getTime() - bEnd.getTime();
  });

  const schedule: Omit<CallSchedule, 'id' | 'created_at' | 'updated_at'>[] = [];

  // Distribute calls across timezones and priorities
  const callsPerTimezone = Math.ceil(targetCalls / timezonePriority.length);

  for (const timezone of timezonePriority) {
    const tzEndOfBusiness = getTimezoneEndOfBusinessGMT(timezone, now);
    if (now >= tzEndOfBusiness) {
      continue;
    }

    const tzContacts = contactsByTimezone[timezone];
    const tzLabel = getTimezoneLabel(timezone);

    // Distribute by priority: 30% Warm, 25% Follow-Up, 25% High Value, 20% Cold
    const priorities: PriorityLabel[] = ['Warm', 'Follow-Up', 'High Value', 'Cold'];
    const priorityWeights = { 'Warm': 0.3, 'Follow-Up': 0.25, 'High Value': 0.25, 'Cold': 0.2 };

    for (const priority of priorities) {
      const count = Math.ceil(callsPerTimezone * priorityWeights[priority]);
      const suggested = suggestContacts(tzContacts, count, priority);

      suggested.forEach(s => {
        if (schedule.length >= targetCalls) return;
        if (currentTime >= deadline) return;

        const availableSlot = getNextAvailableSlot(currentTime, timezone, callDurationMins);
        if (!availableSlot) return;

        const scheduledTime = availableSlot;
        if (scheduledTime >= deadline) return;

        let contactStatus: 'jammed' | 'traction' | 'client' | 'none' = 'none';
        if (s.contact) {
          if (s.contact.is_jammed) {
            contactStatus = 'jammed';
          } else if (s.contact.is_client) {
            contactStatus = 'client';
          } else if (s.contact.has_traction) {
            contactStatus = 'traction';
          }
        }

        schedule.push({
          goal_id: goalId,
          scheduled_time: scheduledTime.toISOString(),
          contact_id: s.contact?.id,
          contact_name: s.contactName,
          priority_label: s.priorityLabel,
          contact_status: contactStatus,
          is_suggested: !s.contact,
          completed: false,
          call_duration_mins: callDurationMins,
          timezone_label: tzLabel,
          notes: s.reason,
          user_id: userId
        });

        const interval = fillRestOfDay ? callDurationMins : (callDurationMins + 5);
        currentTime = new Date(scheduledTime.getTime() + interval * 60 * 1000);
      });
    }
  }

  // If we still need more calls, cycle through remaining contacts from all timezones
  // Only include contacts whose current local time is between 9 AM - 5 PM
  const scheduledContactIds = new Set(schedule.map(s => s.contact_id).filter(Boolean));
  const remainingContacts = activeContacts.filter(c => {
    if (scheduledContactIds.has(c.id)) return false;
    const tz = c.timezone || 'GMT+0';
    return isWithinBusinessHours(now, tz);
  });

  let contactIndex = 0;
  while (schedule.length < targetCalls && currentTime < deadline) {
    let contactToSchedule: SuggestedContact;

    if (contactIndex < remainingContacts.length) {
      const contact = remainingContacts[contactIndex];
      const priority = analyzeContactPriority(contact);
      const timezone = contact.timezone || 'GMT+0';
      const tzLabel = getTimezoneLabel(timezone);

      let contactStatus: 'jammed' | 'traction' | 'client' | 'none' = 'none';
      if (contact.is_jammed) {
        contactStatus = 'jammed';
      } else if (contact.is_client) {
        contactStatus = 'client';
      } else if (contact.has_traction) {
        contactStatus = 'traction';
      }

      contactToSchedule = {
        contact: contact,
        contactName: contact.name || contact.company || 'Unknown',
        priorityLabel: priority,
        timezoneLabel: tzLabel,
        reason: getReasonText(contact, priority)
      };

      schedule.push({
        goal_id: goalId,
        scheduled_time: currentTime.toISOString(),
        contact_id: contact.id,
        contact_name: contactToSchedule.contactName,
        priority_label: contactToSchedule.priorityLabel,
        contact_status: contactStatus,
        is_suggested: false,
        completed: false,
        call_duration_mins: callDurationMins,
        timezone_label: contactToSchedule.timezoneLabel,
        notes: contactToSchedule.reason,
        user_id: userId
      });

      contactIndex++;
    } else {
      // Only use generic labels if we've exhausted all contacts
      schedule.push({
        goal_id: goalId,
        scheduled_time: currentTime.toISOString(),
        contact_name: 'Unassigned slot',
        priority_label: 'Cold',
        contact_status: 'none',
        is_suggested: true,
        completed: false,
        call_duration_mins: callDurationMins,
        timezone_label: 'To be assigned',
        notes: 'Manual assignment needed',
        user_id: userId
      });
    }

    const interval = fillRestOfDay ? callDurationMins : (callDurationMins + 5);
    currentTime = new Date(currentTime.getTime() + interval * 60 * 1000);
  }

  return schedule.slice(0, targetCalls);
}
