import { Contact, ContactWithActivity, CallSchedule, Task } from './supabase';

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
  goalId: string,
  tasks: Task[] = []
): Omit<CallSchedule, 'id' | 'created_at' | 'updated_at'>[] {
  const { totalCalls, deadlineGMT, callDurationMins, fillRestOfDay, statusFilters } = params;

  const now = new Date();
  let deadline = new Date(deadlineGMT);

  // If fillRestOfDay is enabled, set deadline to 5:00 PM GMT (17:00) today
  if (fillRestOfDay) {
    deadline = new Date(now);
    deadline.setUTCHours(17, 0, 0, 0);

    // If 5 PM GMT has already passed today, this won't work, so keep original deadline
    if (deadline <= now) {
      deadline = new Date(deadlineGMT);
    }
  }

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

  // Group contacts by timezone
  const contactsByTimezone: Record<string, (Contact | ContactWithActivity)[]> = {};
  activeContacts.forEach(c => {
    const tz = c.timezone || 'GMT+0';

    // When fillRestOfDay is enabled, include all contacts regardless of current time
    // Otherwise, only include contacts if their current local time is between 9 AM - 5 PM
    if (!fillRestOfDay && !isWithinBusinessHours(now, tz)) {
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

  // First, add call_back tasks that are due today
  const callBackTasks = tasks.filter(task => {
    if (task.task_type !== 'call_back' || task.completed || !task.due_date) {
      return false;
    }
    const taskDueDate = new Date(task.due_date);
    return taskDueDate >= now && taskDueDate <= deadline;
  });

  // Create a map of contact IDs to contacts for quick lookup
  const contactMap = new Map<string, Contact | ContactWithActivity>();
  contacts.forEach(c => contactMap.set(c.id, c));

  // Add tasks to the schedule first
  callBackTasks.forEach(task => {
    const contact = task.contact_id ? contactMap.get(task.contact_id) : undefined;
    const taskDueDate = new Date(task.due_date!);

    let contactStatus: 'jammed' | 'traction' | 'client' | 'none' = 'none';
    let contactName = task.title;
    let timezoneLabel = 'GMT+0';
    let priorityLabel: 'Warm' | 'Follow-Up' | 'High Value' | 'Cold' = 'Follow-Up';

    if (contact) {
      contactName = contact.name || contact.company || task.title;
      timezoneLabel = getTimezoneLabel(contact.timezone);
      priorityLabel = analyzeContactPriority(contact);

      if (contact.is_jammed) {
        contactStatus = 'jammed';
      } else if (contact.is_client) {
        contactStatus = 'client';
      } else if (contact.has_traction) {
        contactStatus = 'traction';
      }
    }

    schedule.push({
      goal_id: goalId,
      scheduled_time: taskDueDate.toISOString(),
      contact_id: task.contact_id,
      contact_name: contactName,
      priority_label: priorityLabel,
      contact_status: contactStatus,
      is_suggested: false,
      completed: false,
      call_duration_mins: callDurationMins,
      timezone_label: timezoneLabel,
      notes: task.notes || 'Scheduled task',
      display_order: 0,
      user_id: userId
    });
  });

  // Helper function to check if a time slot conflicts with existing schedule
  const hasConflict = (slotTime: Date): boolean => {
    return schedule.some(item => {
      const itemStart = new Date(item.scheduled_time);
      const itemEnd = new Date(itemStart.getTime() + item.call_duration_mins * 60 * 1000);
      const slotEnd = new Date(slotTime.getTime() + callDurationMins * 60 * 1000);

      // Check if slots overlap
      return (slotTime >= itemStart && slotTime < itemEnd) ||
             (slotEnd > itemStart && slotEnd <= itemEnd) ||
             (slotTime <= itemStart && slotEnd >= itemEnd);
    });
  };

  // Helper function to find next available slot that doesn't conflict
  const findNextAvailableSlot = (startTime: Date, timezone: string): Date | null => {
    let candidateTime = new Date(startTime);
    const maxAttempts = 100; // Prevent infinite loops
    let attempts = 0;

    while (attempts < maxAttempts && candidateTime < deadline) {
      const availableSlot = getNextAvailableSlot(candidateTime, timezone, callDurationMins);
      if (!availableSlot || availableSlot >= deadline) return null;

      if (!hasConflict(availableSlot)) {
        return availableSlot;
      }

      // Move to after the conflicting slot
      const interval = fillRestOfDay ? callDurationMins : (callDurationMins + 5);
      candidateTime = new Date(availableSlot.getTime() + interval * 60 * 1000);
      attempts++;
    }

    return null;
  };

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

        const availableSlot = findNextAvailableSlot(currentTime, timezone);
        if (!availableSlot) return;

        const scheduledTime = availableSlot;
        if (scheduledTime >= deadline) return;

        // Verify the scheduled time is within 9 AM - 5 PM for this contact's timezone
        if (!isWithinBusinessHours(scheduledTime, timezone)) return;

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
          display_order: schedule.length,
          user_id: userId
        });

        const interval = fillRestOfDay ? callDurationMins : (callDurationMins + 5);
        currentTime = new Date(scheduledTime.getTime() + interval * 60 * 1000);
      });
    }
  }

  // If we still need more calls, cycle through remaining contacts from all timezones
  const scheduledContactIds = new Set(schedule.map(s => s.contact_id).filter(Boolean));
  const remainingContacts = activeContacts.filter(c => {
    if (scheduledContactIds.has(c.id)) return false;
    const tz = c.timezone || 'GMT+0';
    // When fillRestOfDay is enabled, include all contacts
    // Otherwise, only include contacts whose current local time is between 9 AM - 5 PM
    return fillRestOfDay || isWithinBusinessHours(now, tz);
  });

  let contactIndex = 0;
  let failedAttempts = 0;
  const maxFailedAttempts = remainingContacts.length || 10;

  while (currentTime < deadline) {
    // Find a contact that can be called at this time
    let scheduled = false;

    // Try to find an available contact
    for (let i = 0; i < remainingContacts.length && !scheduled; i++) {
      const contact = remainingContacts[contactIndex % remainingContacts.length];
      const priority = analyzeContactPriority(contact);
      const timezone = contact.timezone || 'GMT+0';
      const tzLabel = getTimezoneLabel(timezone);

      // Check if the current time is within business hours for this contact's timezone
      if (isWithinBusinessHours(currentTime, timezone)) {
        const availableSlot = findNextAvailableSlot(currentTime, timezone);

        if (availableSlot && availableSlot < deadline) {
          let contactStatus: 'jammed' | 'traction' | 'client' | 'none' = 'none';
          if (contact.is_jammed) {
            contactStatus = 'jammed';
          } else if (contact.is_client) {
            contactStatus = 'client';
          } else if (contact.has_traction) {
            contactStatus = 'traction';
          }

          schedule.push({
            goal_id: goalId,
            scheduled_time: availableSlot.toISOString(),
            contact_id: contact.id,
            contact_name: contact.name || contact.company || 'Unknown',
            priority_label: priority,
            contact_status: contactStatus,
            is_suggested: false,
            completed: false,
            call_duration_mins: callDurationMins,
            timezone_label: tzLabel,
            notes: getReasonText(contact, priority),
            display_order: schedule.length,
            user_id: userId
          });

          const interval = fillRestOfDay ? callDurationMins : (callDurationMins + 5);
          currentTime = new Date(availableSlot.getTime() + interval * 60 * 1000);
          scheduled = true;
          failedAttempts = 0;
        }
      }

      contactIndex++;
    }

    // If no contact was available for this slot, create an unassigned slot
    if (!scheduled) {
      if (fillRestOfDay && currentTime < deadline) {
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
          display_order: schedule.length,
          user_id: userId
        });
      }

      const interval = fillRestOfDay ? callDurationMins : (callDurationMins + 5);
      currentTime = new Date(currentTime.getTime() + interval * 60 * 1000);

      failedAttempts++;
      if (failedAttempts > maxFailedAttempts && !fillRestOfDay) {
        break;
      }
    }

    // Safety check to prevent infinite loops
    if (!fillRestOfDay && schedule.length >= targetCalls) {
      break;
    }
  }

  // Sort schedule by scheduled_time
  schedule.sort((a, b) => {
    const timeA = new Date(a.scheduled_time).getTime();
    const timeB = new Date(b.scheduled_time).getTime();
    return timeA - timeB;
  });

  // Update display_order after sorting
  schedule.forEach((entry, index) => {
    entry.display_order = index;
  });

  return fillRestOfDay ? schedule : schedule.slice(0, targetCalls);
}
