import { Contact, ContactWithActivity, CallSchedule } from './supabase';

// Timezone data with business hours
const TIMEZONE_DATA = {
  'Asia/Singapore': { offset: '+08:00', endOfBusiness: 18, label: 'Singapore' },
  'Asia/Dubai': { offset: '+04:00', endOfBusiness: 18, label: 'Dubai' },
  'Asia/Hong_Kong': { offset: '+08:00', endOfBusiness: 18, label: 'Hong Kong' },
  'Asia/Tokyo': { offset: '+09:00', endOfBusiness: 18, label: 'Tokyo' },
  'Asia/Shanghai': { offset: '+08:00', endOfBusiness: 18, label: 'Shanghai' },
  'Asia/Kolkata': { offset: '+05:30', endOfBusiness: 18, label: 'India' },
  'Europe/London': { offset: '+00:00', endOfBusiness: 17, label: 'UK' },
  'Europe/Paris': { offset: '+01:00', endOfBusiness: 18, label: 'France' },
  'Europe/Berlin': { offset: '+01:00', endOfBusiness: 18, label: 'Germany' },
  'Europe/Amsterdam': { offset: '+01:00', endOfBusiness: 18, label: 'Netherlands' },
  'Europe/Athens': { offset: '+02:00', endOfBusiness: 18, label: 'Greece' },
  'America/New_York': { offset: '-05:00', endOfBusiness: 17, label: 'US East' },
  'America/Chicago': { offset: '-06:00', endOfBusiness: 17, label: 'US Central' },
  'America/Los_Angeles': { offset: '-08:00', endOfBusiness: 17, label: 'US West' },
  'America/Toronto': { offset: '-05:00', endOfBusiness: 17, label: 'Canada' },
};

export type PriorityLabel = 'Warm' | 'Follow-Up' | 'High Value' | 'Cold';

export interface ScheduleParams {
  totalCalls: number;
  deadlineGMT: string;
  callDurationMins: number;
  timezoneDistribution?: Record<string, number>;
  priorityDistribution?: Record<PriorityLabel, number>;
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
  const { totalCalls, deadlineGMT, callDurationMins } = params;

  const deadline = new Date(deadlineGMT);
  const now = new Date();

  // Start from current time
  let currentTime = new Date(now);

  // Filter out jammed contacts
  const activeContacts = contacts.filter(c => !c.is_jammed);

  // Group contacts by timezone
  const contactsByTimezone: Record<string, (Contact | ContactWithActivity)[]> = {};
  activeContacts.forEach(c => {
    const tz = c.timezone || 'Europe/London';
    if (!contactsByTimezone[tz]) {
      contactsByTimezone[tz] = [];
    }
    contactsByTimezone[tz].push(c);
  });

  // Sort timezones by end of business time (earliest first)
  const timezonePriority = Object.keys(contactsByTimezone).sort((a, b) => {
    const aEnd = getTimezoneEndOfBusinessGMT(a);
    const bEnd = getTimezoneEndOfBusinessGMT(b);
    return aEnd.getTime() - bEnd.getTime();
  });

  const schedule: Omit<CallSchedule, 'id' | 'created_at' | 'updated_at'>[] = [];

  // Distribute calls across timezones and priorities
  const callsPerTimezone = Math.ceil(totalCalls / timezonePriority.length);

  for (const timezone of timezonePriority) {
    const tzContacts = contactsByTimezone[timezone];
    const tzLabel = getTimezoneLabel(timezone);

    // Distribute by priority: 30% Warm, 25% Follow-Up, 25% High Value, 20% Cold
    const priorities: PriorityLabel[] = ['Warm', 'Follow-Up', 'High Value', 'Cold'];
    const priorityWeights = { 'Warm': 0.3, 'Follow-Up': 0.25, 'High Value': 0.25, 'Cold': 0.2 };

    for (const priority of priorities) {
      const count = Math.ceil(callsPerTimezone * priorityWeights[priority]);
      const suggested = suggestContacts(tzContacts, count, priority);

      suggested.forEach(s => {
        if (schedule.length >= totalCalls) return;
        if (currentTime >= deadline) return;

        // Determine contact status
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
          scheduled_time: currentTime.toISOString(),
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

        // Move to next slot (call duration + 5 min buffer)
        currentTime = new Date(currentTime.getTime() + (callDurationMins + 5) * 60 * 1000);
      });
    }
  }

  // If we still need more calls, add generic suggestions
  while (schedule.length < totalCalls && currentTime < deadline) {
    schedule.push({
      goal_id: goalId,
      scheduled_time: currentTime.toISOString(),
      contact_name: `Prospect #${schedule.length + 1}`,
      priority_label: 'Cold',
      contact_status: 'none',
      is_suggested: true,
      completed: false,
      call_duration_mins: callDurationMins,
      timezone_label: 'To be assigned',
      notes: 'New prospect - manual assignment needed',
      user_id: userId
    });

    currentTime = new Date(currentTime.getTime() + (callDurationMins + 5) * 60 * 1000);
  }

  return schedule.slice(0, totalCalls);
}
