import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Contact {
  id: string;
  name: string;
  company?: string;
  reminder_days?: number;
  created_at: string;
}

interface Call {
  contact_id: string;
  call_date: string;
}

interface ContactPerson {
  contact_id: string;
  name: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('enabled', true)
      .maybeSingle();

    if (settingsError) throw settingsError;

    if (!settings) {
      return new Response(
        JSON.stringify({ message: 'No notification settings found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get all contacts with reminders
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .not('reminder_days', 'is', null);

    if (contactsError) throw contactsError;

    // Get all calls
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('contact_id, call_date')
      .order('call_date', { ascending: false });

    if (callsError) throw callsError;

    // Get all contact persons
    const { data: contactPersons, error: personsError } = await supabase
      .from('contact_persons')
      .select('*');

    if (personsError) throw personsError;

    const now = new Date();
    const reminders: any[] = [];

    // Process each contact
    for (const contact of (contacts as Contact[]) || []) {
      const contactCalls = (calls as Call[])?.filter(
        (call) => call.contact_id === contact.id
      ) || [];

      const persons = (contactPersons as ContactPerson[])?.filter(
        (p) => p.contact_id === contact.id
      ) || [];

      const primaryPerson = persons.find((p) => p.is_primary);

      let nextCallDate: Date;

      if (contactCalls.length > 0) {
        const lastCallDate = new Date(contactCalls[0].call_date);
        nextCallDate = new Date(lastCallDate);
        nextCallDate.setDate(nextCallDate.getDate() + contact.reminder_days!);
      } else {
        const createdDate = new Date(contact.created_at);
        nextCallDate = new Date(createdDate);
        nextCallDate.setDate(nextCallDate.getDate() + contact.reminder_days!);
      }

      // Calculate days until due
      const diffTime = nextCallDate.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Send reminder if it matches the days_before_reminder setting
      if (daysUntilDue === settings.days_before_reminder) {
        reminders.push({
          contact: contact.name,
          company: contact.company,
          primaryPerson: primaryPerson?.name,
          primaryPhone: primaryPerson?.phone,
          primaryEmail: primaryPerson?.email,
          daysUntilDue,
          nextCallDate: nextCallDate.toISOString(),
        });
      }
    }

    // If there are reminders, prepare email content
    if (reminders.length > 0) {
      let emailBody = `<h2>Call Reminders - ${new Date().toLocaleDateString()}</h2>`;
      emailBody += `<p>You have ${reminders.length} contact(s) that need calling soon:</p>`;
      emailBody += '<ul>';

      for (const reminder of reminders) {
        emailBody += `<li><strong>${reminder.contact}</strong>`;
        if (reminder.company) emailBody += ` (${reminder.company})`;
        emailBody += `<br/>Call due in ${reminder.daysUntilDue} day(s)`;
        if (reminder.primaryPerson) {
          emailBody += `<br/>PIC: ${reminder.primaryPerson}`;
          if (reminder.primaryPhone) emailBody += ` - ${reminder.primaryPhone}`;
          if (reminder.primaryEmail) emailBody += ` - ${reminder.primaryEmail}`;
        }
        emailBody += '</li><br/>';
      }

      emailBody += '</ul>';

      // Note: In production, you would integrate with an email service like SendGrid, Resend, or AWS SES
      // For now, we'll just log the email content
      console.log('Email to:', settings.user_email);
      console.log('Email body:', emailBody);

      // Update last_check timestamp
      await supabase
        .from('notification_settings')
        .update({ last_check: new Date().toISOString() })
        .eq('id', settings.id);
    }

    return new Response(
      JSON.stringify({
        message: 'Reminders processed',
        reminderCount: reminders.length,
        reminders,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});