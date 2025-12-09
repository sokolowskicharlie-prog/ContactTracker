import { X, Plus, Trash2, Star, Globe as Globe2, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ContactWithActivity, ContactPerson } from '../lib/supabase';
import { COUNTRIES, TIMEZONES, getTimezoneForCountry } from '../lib/timezones';

interface ContactModalProps {
  contact?: ContactWithActivity;
  onClose: () => void;
  onSave: (contact: Partial<ContactWithActivity>, contactPersons: Partial<ContactPerson>[]) => void;
}

export default function ContactModal({ contact, onClose, onSave }: ContactModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneType, setPhoneType] = useState('general');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyExcerpt, setCompanyExcerpt] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postCode, setPostCode] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [reminderDays, setReminderDays] = useState('');
  const [notes, setNotes] = useState('');
  const [contactPersons, setContactPersons] = useState<Partial<ContactPerson>[]>([]);

  useEffect(() => {
    console.log('ContactModal received contact:', contact);
    if (contact) {
      console.log('Loading contact persons:', contact.contact_persons);
      setName(contact.name);
      setPhone(contact.phone || '');
      setPhoneType(contact.phone_type || 'general');
      setEmail(contact.email || '');
      setCompany(contact.company || '');
      setCompanySize(contact.company_size || '');
      setCompanyExcerpt(contact.company_excerpt || '');
      setWebsite(contact.website || '');
      setAddress(contact.address || '');
      setCity(contact.city || '');
      setPostCode(contact.post_code || '');
      setCountry(contact.country || '');
      setTimezone(contact.timezone || '');
      setReminderDays(contact.reminder_days?.toString() || '');
      setNotes(contact.notes || '');
      setContactPersons(contact.contact_persons || []);
      console.log('Contact persons loaded into state:', contact.contact_persons?.length || 0);
    } else {
      console.log('New contact - resetting all fields');
      setName('');
      setPhone('');
      setPhoneType('general');
      setEmail('');
      setCompany('');
      setCompanySize('');
      setCompanyExcerpt('');
      setWebsite('');
      setAddress('');
      setCity('');
      setPostCode('');
      setCountry('');
      setTimezone('');
      setReminderDays('');
      setNotes('');
      setContactPersons([]);
    }
  }, [contact]);

  const addContactPerson = () => {
    setContactPersons([...contactPersons, { name: '', job_title: '', phone: '', phone_type: 'general', mobile: '', mobile_type: 'general', email: '', is_primary: contactPersons.length === 0 }]);
  };

  const removeContactPerson = (index: number) => {
    const updated = contactPersons.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some(p => p.is_primary)) {
      updated[0].is_primary = true;
    }
    setContactPersons(updated);
  };

  const updateContactPerson = (index: number, field: keyof ContactPerson, value: any) => {
    const updated = [...contactPersons];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'is_primary' && value) {
      updated.forEach((p, i) => {
        if (i !== index) p.is_primary = false;
      });
    }
    setContactPersons(updated);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;

    const validContactPersons = contactPersons
      .filter(p => p.name && p.name.trim())
      .map(p => ({
        ...p,
        name: p.name!.trim(),
        job_title: p.job_title?.trim() || null,
        phone: p.phone?.trim() || null,
        phone_type: p.phone?.trim() ? (p.phone_type || 'general') : null,
        mobile: p.mobile?.trim() || null,
        mobile_type: p.mobile?.trim() ? (p.mobile_type || 'general') : null,
        email: p.email?.trim() || null,
      }));

    console.log('Submitting contact with', validContactPersons.length, 'valid PICs');
    console.log('Valid PICs:', validContactPersons);

    const contactDataToSave = {
      ...(contact ? { id: contact.id } : {}),
      name: name.trim(),
      phone: phone.trim() || null,
      phone_type: phone.trim() ? phoneType : null,
      email: email.trim() || null,
      company: company.trim() || null,
      company_size: companySize || null,
      company_excerpt: companyExcerpt.trim() || null,
      website: website.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      post_code: postCode.trim() || null,
      country: country || null,
      timezone: timezone || null,
      reminder_days: reminderDays ? parseInt(reminderDays) : null,
      notes: notes.trim() || null,
    };

    console.log('Submitting contact data:', contactDataToSave);

    onSave(contactDataToSave, validContactPersons);
    onClose();
  };

  const handleClose = () => {
    // If editing an existing contact and name is filled, save changes
    if (contact && name.trim()) {
      handleSubmit();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {contact ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <select
                value={phoneType}
                onChange={(e) => setPhoneType(e.target.value)}
                disabled={!phone.trim()}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="office">Office</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@example.com (use ; to separate multiple emails)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Acme Inc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Size
            </label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select size...</option>
              <option value="Micro (1-10)">Micro (1-10)</option>
              <option value="Small (11-50)">Small (11-50)</option>
              <option value="Medium (51-200)">Medium (51-200)</option>
              <option value="Large (201-500)">Large (201-500)</option>
              <option value="Enterprise (500+)">Enterprise (500+)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Description
            </label>
            <textarea
              value={companyExcerpt}
              onChange={(e) => setCompanyExcerpt(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the company..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Full street address..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Post Code
              </label>
              <input
                type="text"
                value={postCode}
                onChange={(e) => setPostCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Postal code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Globe2 className="w-4 h-4" />
                Country
              </label>
              <select
                value={country}
                onChange={(e) => {
                  const selectedCountry = e.target.value;
                  setCountry(selectedCountry);
                  const autoTimezone = getTimezoneForCountry(selectedCountry);
                  if (autoTimezone) {
                    setTimezone(autoTimezone);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select timezone</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Call Reminder (days)
            </label>
            <input
              type="number"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 7, 14, 30"
            />
            <p className="text-xs text-gray-500 mt-1">How often you want to call this contact</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Contact Persons (PIC)
              </label>
              <button
                type="button"
                onClick={addContactPerson}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Person
              </button>
            </div>

            <div className="space-y-3">
              {contactPersons.map((person, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={person.name || ''}
                        onChange={(e) => updateContactPerson(index, 'name', e.target.value)}
                        placeholder="Person name (PIC)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="text"
                        value={person.job_title || ''}
                        onChange={(e) => updateContactPerson(index, 'job_title', e.target.value)}
                        placeholder="Job title (e.g., Operations Manager)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="text"
                        value={person.email || ''}
                        onChange={(e) => updateContactPerson(index, 'email', e.target.value)}
                        placeholder="Email (use ; to separate multiple emails)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="tel"
                          value={person.phone || ''}
                          onChange={(e) => updateContactPerson(index, 'phone', e.target.value)}
                          placeholder="Phone"
                          className="col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <select
                          value={person.phone_type || 'general'}
                          onChange={(e) => updateContactPerson(index, 'phone_type', e.target.value)}
                          disabled={!person.phone?.trim()}
                          className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          <option value="office">Office</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="general">General</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="tel"
                          value={person.mobile || ''}
                          onChange={(e) => updateContactPerson(index, 'mobile', e.target.value)}
                          placeholder="Mobile"
                          className="col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <select
                          value={person.mobile_type || 'general'}
                          onChange={(e) => updateContactPerson(index, 'mobile_type', e.target.value)}
                          disabled={!person.mobile?.trim()}
                          className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="general">General</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateContactPerson(index, 'is_primary', !person.is_primary)}
                      className={`p-2 rounded-lg transition-colors ${
                        person.is_primary ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                      }`}
                      title="Primary contact"
                    >
                      <Star className="w-4 h-4" fill={person.is_primary ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeContactPerson(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {contactPersons.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No contact persons added. Click "Add Person" to add PICs.</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {contact ? 'Update' : 'Add'} Contact
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
