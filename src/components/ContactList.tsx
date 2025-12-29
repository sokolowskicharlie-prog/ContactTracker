import { Phone, Mail, Building2, Calendar, Trash2, CreditCard as Edit, Globe, Bell, AlertCircle, User, Star, Check, Globe2, Clock, CheckSquare, AlertTriangle, StickyNote } from 'lucide-react';
import { ContactWithActivity } from '../lib/supabase';
import { useState, useEffect } from 'react';

interface SavedNote {
  id: string;
  title: string;
  content: string;
  contact_id?: string;
  created_at: string;
  updated_at: string;
}

interface ContactListProps {
  contacts: ContactWithActivity[];
  notes: SavedNote[];
  onContactClick: (contact: ContactWithActivity) => void;
  onDeleteContact: (id: string) => void;
  onEditContact: (contact: ContactWithActivity) => void;
}

export default function ContactList({ contacts, notes, onContactClick, onDeleteContact, onEditContact }: ContactListProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  const getContactNotes = (contactId: string) => {
    return notes.filter(n => n.contact_id === contactId);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getDuplicateCompanies = () => {
    const companyCount = new Map<string, number>();
    contacts.forEach(contact => {
      if (contact.company && contact.company.trim() !== '') {
        const company = contact.company.toLowerCase().trim();
        companyCount.set(company, (companyCount.get(company) || 0) + 1);
      }
    });
    return new Set(
      Array.from(companyCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([company]) => company)
    );
  };

  const getDuplicateNames = () => {
    const nameCount = new Map<string, number>();
    contacts.forEach(contact => {
      if (contact.name && contact.name.trim() !== '') {
        const name = contact.name.toLowerCase().trim();
        nameCount.set(name, (nameCount.get(name) || 0) + 1);
      }
    });
    return new Set(
      Array.from(nameCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([name]) => name)
    );
  };

  const duplicateCompanies = getDuplicateCompanies();
  const duplicateNames = getDuplicateNames();

  const isDuplicateCompany = (company?: string) => {
    if (!company || company.trim() === '') return false;
    return duplicateCompanies.has(company.toLowerCase().trim());
  };

  const isDuplicateName = (name?: string) => {
    if (!name || name.trim() === '') return false;
    return duplicateNames.has(name.toLowerCase().trim());
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimezoneFromCountry = (country?: string) => {
    if (!country) return null;

    const countryTimezones: Record<string, string> = {
      'Singapore': 'Asia/Singapore',
      'United States': 'America/New_York',
      'USA': 'America/New_York',
      'United Kingdom': 'Europe/London',
      'UK': 'Europe/London',
      'Japan': 'Asia/Tokyo',
      'China': 'Asia/Shanghai',
      'Australia': 'Australia/Sydney',
      'Germany': 'Europe/Berlin',
      'France': 'Europe/Paris',
      'India': 'Asia/Kolkata',
      'South Korea': 'Asia/Seoul',
      'Canada': 'America/Toronto',
      'Brazil': 'America/Sao_Paulo',
      'Mexico': 'America/Mexico_City',
      'Italy': 'Europe/Rome',
      'Spain': 'Europe/Madrid',
      'Netherlands': 'Europe/Amsterdam',
      'Switzerland': 'Europe/Zurich',
      'Sweden': 'Europe/Stockholm',
      'Norway': 'Europe/Oslo',
      'Denmark': 'Europe/Copenhagen',
      'Finland': 'Europe/Helsinki',
      'Russia': 'Europe/Moscow',
      'UAE': 'Asia/Dubai',
      'Saudi Arabia': 'Asia/Riyadh',
      'Hong Kong': 'Asia/Hong_Kong',
      'Taiwan': 'Asia/Taipei',
      'Thailand': 'Asia/Bangkok',
      'Malaysia': 'Asia/Kuala_Lumpur',
      'Indonesia': 'Asia/Jakarta',
      'Philippines': 'Asia/Manila',
      'Vietnam': 'Asia/Ho_Chi_Minh',
      'New Zealand': 'Pacific/Auckland',
      'South Africa': 'Africa/Johannesburg',
      'Egypt': 'Africa/Cairo',
      'Turkey': 'Europe/Istanbul',
      'Greece': 'Europe/Athens',
      'Poland': 'Europe/Warsaw',
      'Portugal': 'Europe/Lisbon',
      'Ireland': 'Europe/Dublin',
      'Belgium': 'Europe/Brussels',
      'Austria': 'Europe/Vienna',
      'Czech Republic': 'Europe/Prague',
      'Argentina': 'America/Argentina/Buenos_Aires',
      'Chile': 'America/Santiago',
      'Colombia': 'America/Bogota',
      'Peru': 'America/Lima',
    };

    return countryTimezones[country] || null;
  };

  const getLocalTime = (country?: string) => {
    const timezone = getTimezoneFromCountry(country);
    if (!timezone) return null;
    try {
      return currentTime.toLocaleString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return null;
    }
  };

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className={`rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
            isDuplicateCompany(contact.company) || isDuplicateName(contact.name)
              ? 'bg-orange-50 border-orange-300'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onContactClick(contact)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                    {contact.has_traction && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                    {contact.is_client && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    {contact.is_jammed && (
                      <AlertTriangle className="w-4 h-4 text-red-600 fill-red-100" />
                    )}
                  </div>
                  {(contact.is_jammed && contact.jammed_note) && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      <span className="text-xs text-red-700 font-medium">
                        {contact.jammed_note}
                      </span>
                    </div>
                  )}
                  {(contact.is_client && contact.client_note) && (
                    <div className="flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">
                        {contact.client_note}
                      </span>
                    </div>
                  )}
                  {(contact.has_traction && contact.traction_note) && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-600" />
                      <span className="text-xs text-yellow-700 font-medium">
                        {contact.traction_note}
                      </span>
                    </div>
                  )}
                  {contact.updated_at && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Last edited: {formatDateTime(contact.updated_at)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({formatDate(contact.updated_at)})
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {contact.company && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="w-4 h-4 mr-1" />
                      {contact.company}
                      {contact.company_size && (
                        <span className="ml-1 text-xs text-gray-500">({contact.company_size})</span>
                      )}
                    </div>
                  )}
                  {contact.country && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Globe2 className="w-3 h-3 mr-1" />
                      <span>{contact.country}</span>
                      {getLocalTime(contact.country) && (
                        <span className="ml-1 font-medium text-gray-700">
                          {getLocalTime(contact.country)}
                        </span>
                      )}
                    </div>
                  )}
                  {contact.timezone && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {contact.timezone.split('/')[1]?.replace('_', ' ')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditContact(contact);
                  }}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${contact.name}?`)) {
                      onDeleteContact(contact.id);
                    }
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1 mb-3">
              {contact.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {contact.phone}
                </div>
              )}
              {contact.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {contact.email}
                </div>
              )}
              {contact.website && (
                <div className="flex items-center text-sm text-gray-600">
                  <Globe className="w-4 h-4 mr-2" />
                  <a href={contact.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    {contact.website}
                  </a>
                </div>
              )}
              {contact.notes && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{contact.notes}</p>
              )}
              {contact.company_excerpt && (
                <p className="text-sm text-gray-500 italic mt-2">{contact.company_excerpt}</p>
              )}
              {contact.contact_persons && contact.contact_persons.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <User className="w-3 h-3 mr-1" />
                    {contact.contact_persons.length} PIC{contact.contact_persons.length > 1 ? 's' : ''}
                  </div>
                  {contact.contact_persons
                    .filter(p => p.is_primary)
                    .slice(0, 1)
                    .map(person => (
                      <div key={person.id} className="text-xs space-y-0.5">
                        <div className="text-gray-700 font-medium">{person.name}</div>
                        {person.job_title && (
                          <div className="text-gray-500 text-xs">{person.job_title}</div>
                        )}
                        {person.phone && (
                          <div className="flex items-center text-gray-600">
                            <Phone className="w-3 h-3 mr-1" />
                            {person.phone}
                          </div>
                        )}
                        {person.email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-3 h-3 mr-1" />
                            {person.email}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              {contact.reminder_days && (
                <div className={`flex items-center justify-between p-2 rounded-lg ${
                  contact.is_overdue
                    ? 'bg-red-50 border border-red-200'
                    : contact.days_until_due !== undefined && contact.days_until_due <= 3
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center text-sm">
                    {contact.is_overdue ? (
                      <AlertCircle className="w-4 h-4 mr-1 text-red-600" />
                    ) : (
                      <Bell className="w-4 h-4 mr-1 text-blue-600" />
                    )}
                    <span className={contact.is_overdue ? 'text-red-700 font-medium' : 'text-blue-700'}>
                      {contact.is_overdue
                        ? `Overdue by ${Math.abs(contact.days_until_due || 0)} ${Math.abs(contact.days_until_due || 0) === 1 ? 'day' : 'days'}`
                        : contact.days_until_due === 0
                        ? 'Call due today'
                        : `Call due in ${contact.days_until_due} ${contact.days_until_due === 1 ? 'day' : 'days'}`
                      }
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">Every {contact.reminder_days} days</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-1" />
                  <div className="flex flex-col">
                    <span>Last call: {formatDateTime(contact.last_call_date)}</span>
                    <span className="text-xs text-gray-500">({formatDate(contact.last_call_date)})</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {contact.total_calls} {contact.total_calls === 1 ? 'call' : 'calls'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-1" />
                  <div className="flex flex-col">
                    <span>Last email: {formatDateTime(contact.last_email_date)}</span>
                    <span className="text-xs text-gray-500">({formatDate(contact.last_email_date)})</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {contact.total_emails} {contact.total_emails === 1 ? 'email' : 'emails'}
                </span>
              </div>
              {contact.total_tasks > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Tasks
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.pending_tasks > 0 && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {contact.pending_tasks} pending
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {contact.total_tasks} total
                    </span>
                  </div>
                </div>
              )}
              {getContactNotes(contact.id).length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <StickyNote className="w-4 h-4 mr-1" />
                    <span className="font-medium">Notes ({getContactNotes(contact.id).length})</span>
                  </div>
                  <div className="ml-5 space-y-1">
                    {getContactNotes(contact.id).map(note => (
                      <div key={note.id} className="text-xs text-gray-600 truncate">
                        • {note.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {contacts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Phone className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No contacts yet. Add your first contact to get started!</p>
        </div>
      )}
    </div>
  );
}
