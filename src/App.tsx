import { useEffect, useState } from 'react';
import { Plus, Search, Users, Upload, Settings, Filter, Package, Trash2, LayoutGrid, Table, CheckSquare, History, ArrowUpDown, Download, Copy, LogOut, UserCog, Target } from 'lucide-react';
import { useAuth } from './lib/auth';
import AuthForm from './components/AuthForm';
import { supabase, ContactWithActivity, ContactPerson, Vessel, FuelDeal, Call, Email, SupplierWithOrders, Supplier, SupplierOrder, SupplierContact, Task, TaskWithRelated, Contact, DailyGoal } from './lib/supabase';
import { getTimezoneForCountry } from './lib/timezones';
import * as XLSX from 'xlsx';
import ContactList from './components/ContactList';
import ContactTableView from './components/ContactTableView';
import ContactModal from './components/ContactModal';
import ContactDetail from './components/ContactDetail';
import CallModal from './components/CallModal';
import EmailModal from './components/EmailModal';
import ImportModal from './components/ImportModal';
import SettingsModal from './components/SettingsModal';
import VesselModal from './components/VesselModal';
import FuelDealModal from './components/FuelDealModal';
import SupplierList from './components/SupplierList';
import SupplierTableView from './components/SupplierTableView';
import SupplierModal from './components/SupplierModal';
import SupplierDetail from './components/SupplierDetail';
import OrderModal from './components/OrderModal';
import SupplierContactModal from './components/SupplierContactModal';
import TaskModal from './components/TaskModal';
import TaskList from './components/TaskList';
import CommunicationsHistory from './components/CommunicationsHistory';
import ButtonOrderSettings from './components/ButtonOrderSettings';
import MultiSelectDropdown from './components/MultiSelectDropdown';
import AccountSettings from './components/AccountSettings';
import DuplicatesModal from './components/DuplicatesModal';
import SupplierImportModal from './components/SupplierImportModal';
import DailyGoals from './components/DailyGoals';
import GlobalGoalNotifications from './components/GlobalGoalNotifications';
import GoalProgressBox from './components/GoalProgressBox';

interface NotificationSettings {
  id?: string;
  user_email: string;
  days_before_reminder: number;
  enabled: boolean;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'contacts' | 'suppliers' | 'tasks'>('contacts');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [contacts, setContacts] = useState<ContactWithActivity[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactWithActivity[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierWithOrders[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierWithOrders[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showContactDetail, setShowContactDetail] = useState(false);
  const [showVesselModal, setShowVesselModal] = useState(false);
  const [showFuelDealModal, setShowFuelDealModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showSupplierDetail, setShowSupplierDetail] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSupplierContactModal, setShowSupplierContactModal] = useState(false);
  const [showSupplierImportModal, setShowSupplierImportModal] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | undefined>();
  const [editingFuelDeal, setEditingFuelDeal] = useState<FuelDeal | undefined>();
  const [editingCall, setEditingCall] = useState<Call | undefined>();
  const [editingEmail, setEditingEmail] = useState<Email | undefined>();
  const [editingContact, setEditingContact] = useState<ContactWithActivity | undefined>();
  const [selectedContact, setSelectedContact] = useState<ContactWithActivity | undefined>();
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithOrders | undefined>();
  const [editingOrder, setEditingOrder] = useState<SupplierOrder | undefined>();
  const [editingSupplierContact, setEditingSupplierContact] = useState<SupplierContact | undefined>();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | undefined>();
  const [filterCountries, setFilterCountries] = useState<string[]>([]);
  const [filterTimezones, setFilterTimezones] = useState<string[]>([]);
  const [filterNames, setFilterNames] = useState<string[]>([]);
  const [filterCompanies, setFilterCompanies] = useState<string[]>([]);
  const [filterCompanySizes, setFilterCompanySizes] = useState<string[]>([]);
  const [filterEmails, setFilterEmails] = useState<string[]>([]);
  const [filterPhones, setFilterPhones] = useState<string[]>([]);
  const [filterCities, setFilterCities] = useState<string[]>([]);
  const [filterPostCodes, setFilterPostCodes] = useState<string[]>([]);
  const [filterWebsites, setFilterWebsites] = useState<string[]>([]);
  const [filterAddresses, setFilterAddresses] = useState<string[]>([]);
  const [visibleFilters, setVisibleFilters] = useState<{
    name: boolean;
    company: boolean;
    companySize: boolean;
    email: boolean;
    phone: boolean;
    city: boolean;
    postCode: boolean;
    website: boolean;
    address: boolean;
    country: boolean;
    timezone: boolean;
  }>({
    name: true,
    company: true,
    companySize: true,
    email: true,
    phone: true,
    city: true,
    postCode: true,
    website: true,
    address: true,
    country: true,
    timezone: true,
  });
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [activityDateFilter, setActivityDateFilter] = useState<string>('all');
  const [statusFilters, setStatusFilters] = useState<{
    hasTraction: boolean;
    isClient: boolean;
    isJammed: boolean;
  }>({
    hasTraction: false,
    isClient: false,
    isJammed: false,
  });
  const [filterPort, setFilterPort] = useState<string>('all');
  const [filterFuelType, setFilterFuelType] = useState<string>('all');
  const [tasks, setTasks] = useState<TaskWithRelated[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithRelated[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [preselectedContactId, setPreselectedContactId] = useState<string | undefined>();
  const [preselectedSupplierId, setPreselectedSupplierId] = useState<string | undefined>();
  const [showCommunicationsHistory, setShowCommunicationsHistory] = useState(false);
  const [allCalls, setAllCalls] = useState<Call[]>([]);
  const [allEmails, setAllEmails] = useState<Email[]>([]);
  const [allDeals, setAllDeals] = useState<FuelDeal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<DailyGoal[]>([]);
  const [showButtonOrderSettings, setShowButtonOrderSettings] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [showGoalProgressBox, setShowGoalProgressBox] = useState(() => {
    const saved = localStorage.getItem('goalProgressBoxVisible');
    return saved !== null ? saved === 'true' : true;
  });
  const [buttonOrder, setButtonOrder] = useState<string[]>(['copy-emails', 'export', 'history', 'duplicates', 'delete-all', 'settings', 'import', 'add-contact']);
  const { user, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    loadContacts();
    loadSuppliers();
    loadNotificationSettings();
    loadTasks();
    loadButtonOrder();
  }, []);

  useEffect(() => {
    let filtered = [...contacts];

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          contact.company?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.phone?.toLowerCase().includes(query)
      );
    }

    // Apply name filter
    if (filterNames.length > 0) {
      filtered = filtered.filter((contact) => filterNames.includes(contact.name));
    }

    // Apply company filter
    if (filterCompanies.length > 0) {
      filtered = filtered.filter((contact) => contact.company && filterCompanies.includes(contact.company));
    }

    // Apply company size filter
    if (filterCompanySizes.length > 0) {
      filtered = filtered.filter((contact) => contact.company_size && filterCompanySizes.includes(contact.company_size));
    }

    // Apply email filter
    if (filterEmails.length > 0) {
      filtered = filtered.filter((contact) => contact.email && filterEmails.includes(contact.email));
    }

    // Apply phone filter
    if (filterPhones.length > 0) {
      filtered = filtered.filter((contact) => contact.phone && filterPhones.includes(contact.phone));
    }

    // Apply city filter
    if (filterCities.length > 0) {
      filtered = filtered.filter((contact) => contact.city && filterCities.includes(contact.city));
    }

    // Apply post code filter
    if (filterPostCodes.length > 0) {
      filtered = filtered.filter((contact) => contact.post_code && filterPostCodes.includes(contact.post_code));
    }

    // Apply website filter
    if (filterWebsites.length > 0) {
      filtered = filtered.filter((contact) => contact.website && filterWebsites.includes(contact.website));
    }

    // Apply address filter
    if (filterAddresses.length > 0) {
      filtered = filtered.filter((contact) => contact.address && filterAddresses.includes(contact.address));
    }

    // Apply country filter
    if (filterCountries.length > 0) {
      filtered = filtered.filter((contact) => contact.country && filterCountries.includes(contact.country));
    }

    // Apply timezone filter
    if (filterTimezones.length > 0) {
      filtered = filtered.filter((contact) => contact.timezone && filterTimezones.includes(contact.timezone));
    }

    // Apply status filters (OR logic - show contacts matching ANY selected status)
    const hasActiveStatusFilter = statusFilters.hasTraction || statusFilters.isClient || statusFilters.isJammed;
    if (hasActiveStatusFilter) {
      filtered = filtered.filter((contact) => {
        if (statusFilters.hasTraction && contact.has_traction) return true;
        if (statusFilters.isClient && contact.is_client) return true;
        if (statusFilters.isJammed && contact.is_jammed) return true;
        return false;
      });
    }

    // Apply activity date filter
    if (activityDateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter((contact) => {
        const lastCallDate = contact.last_call_date ? new Date(contact.last_call_date) : null;
        const lastEmailDate = contact.last_email_date ? new Date(contact.last_email_date) : null;
        const lastActivityDate = lastCallDate && lastEmailDate
          ? new Date(Math.max(lastCallDate.getTime(), lastEmailDate.getTime()))
          : lastCallDate || lastEmailDate;

        if (!lastActivityDate) return false;

        const diffTime = now.getTime() - lastActivityDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        switch (activityDateFilter) {
          case 'today':
            return diffDays === 0;
          case '3days':
            return diffDays <= 3;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case '3months':
            return diffDays <= 90;
          case '6months':
            return diffDays <= 180;
          case 'year':
            return diffDays <= 365;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        case 'country':
          return (a.country || '').localeCompare(b.country || '');
        case 'timezone':
          return (a.timezone || '').localeCompare(b.timezone || '');
        case 'recent-activity': {
          const getLastActivity = (contact: ContactWithActivity) => {
            const lastCallDate = contact.last_call_date ? new Date(contact.last_call_date).getTime() : 0;
            const lastEmailDate = contact.last_email_date ? new Date(contact.last_email_date).getTime() : 0;
            return Math.max(lastCallDate, lastEmailDate);
          };
          return getLastActivity(b) - getLastActivity(a);
        }
        default:
          return 0;
      }
    });

    setFilteredContacts(filtered);
  }, [searchQuery, contacts, filterCountries, filterTimezones, filterNames, filterCompanies, filterCompanySizes, filterEmails, filterPhones, filterCities, filterPostCodes, filterWebsites, filterAddresses, sortBy, statusFilters, activityDateFilter]);

  useEffect(() => {
    let filtered = [...suppliers];

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (supplier) =>
          supplier.company_name.toLowerCase().includes(query) ||
          supplier.contact_person?.toLowerCase().includes(query) ||
          supplier.email?.toLowerCase().includes(query) ||
          supplier.supplier_type?.toLowerCase().includes(query)
      );
    }

    if (filterPort !== 'all') {
      filtered = filtered.filter((supplier) => {
        if (!supplier.ports) return false;
        const ports = supplier.ports.split(';').map(p => p.trim().toLowerCase());
        return ports.some(port => port.includes(filterPort.toLowerCase()));
      });
    }

    if (filterFuelType !== 'all') {
      filtered = filtered.filter((supplier) => {
        if (!supplier.fuel_types) return false;
        const fuelTypes = supplier.fuel_types.split(';').map(f => f.trim().toLowerCase());
        return fuelTypes.some(fuel => fuel.includes(filterFuelType.toLowerCase()));
      });
    }

    filtered.sort((a, b) => a.company_name.localeCompare(b.company_name));

    setFilteredSuppliers(filtered);
  }, [suppliers, searchQuery, filterPort, filterFuelType]);

  useEffect(() => {
    let filtered = [...tasks];

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.notes?.toLowerCase().includes(query) ||
          task.contact?.name.toLowerCase().includes(query) ||
          task.supplier?.company_name.toLowerCase().includes(query)
      );
    }

    if (taskFilter === 'pending') {
      filtered = filtered.filter((task) => !task.completed);
    } else if (taskFilter === 'completed') {
      filtered = filtered.filter((task) => task.completed);
    }

    filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, taskFilter]);

  const loadContacts = async () => {
    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (contactsError) throw contactsError;

      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .order('call_date', { ascending: false });

      if (callsError) throw callsError;

      const { data: emailsData, error: emailsError } = await supabase
        .from('emails')
        .select('*')
        .order('email_date', { ascending: false });

      if (emailsError) throw emailsError;

      const { data: contactPersonsData, error: contactPersonsError } = await supabase
        .from('contact_persons')
        .select('*');

      if (contactPersonsError) throw contactPersonsError;

      const { data: vesselsData, error: vesselsError } = await supabase
        .from('vessels')
        .select('*');

      if (vesselsError) throw vesselsError;

      const { data: fuelDealsData, error: fuelDealsError } = await supabase
        .from('fuel_deals')
        .select('*')
        .order('deal_date', { ascending: false });

      if (fuelDealsError) throw fuelDealsError;

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*');

      if (tasksError) throw tasksError;

      const { data: completedGoalsData, error: completedGoalsError } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('is_active', false)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (completedGoalsError) throw completedGoalsError;

      setAllCalls(callsData || []);
      setAllEmails(emailsData || []);
      setAllDeals(fuelDealsData || []);
      setCompletedGoals(completedGoalsData || []);

      const now = new Date();
      const contactsWithActivity: ContactWithActivity[] = (contactsData || []).map((contact) => {
        const contactCalls = (callsData || []).filter((call) => call.contact_id === contact.id);
        const contactEmails = (emailsData || []).filter((email) => email.contact_id === contact.id);
        const contactPersons = (contactPersonsData || []).filter((person) => person.contact_id === contact.id);
        const vessels = (vesselsData || []).filter((vessel) => vessel.contact_id === contact.id);
        const fuelDeals = (fuelDealsData || []).filter((deal) => deal.contact_id === contact.id);
        const contactTasks = (tasksData || []).filter((task) => task.contact_id === contact.id);

        const pendingTasks = contactTasks.filter(t => !t.completed && t.due_date);
        const sortedPendingTasks = pendingTasks.sort((a, b) =>
          new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
        );
        const nextTask = sortedPendingTasks[0];

        let next_call_due: string | undefined;
        let is_overdue = false;
        let days_until_due: number | undefined;

        if (contact.reminder_days && contactCalls.length > 0) {
          const lastCallDate = new Date(contactCalls[0].call_date);
          const nextDueDate = new Date(lastCallDate);
          nextDueDate.setDate(nextDueDate.getDate() + contact.reminder_days);
          next_call_due = nextDueDate.toISOString();

          const diffTime = nextDueDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          days_until_due = diffDays;
          is_overdue = diffDays < 0;
        } else if (contact.reminder_days && contactCalls.length === 0) {
          const createdDate = new Date(contact.created_at);
          const nextDueDate = new Date(createdDate);
          nextDueDate.setDate(nextDueDate.getDate() + contact.reminder_days);
          next_call_due = nextDueDate.toISOString();

          const diffTime = nextDueDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          days_until_due = diffDays;
          is_overdue = diffDays < 0;
        }

        return {
          ...contact,
          calls: contactCalls,
          emails: contactEmails,
          contact_persons: contactPersons,
          vessels: vessels,
          fuel_deals: fuelDeals,
          tasks: contactTasks,
          last_call_date: contactCalls[0]?.call_date,
          last_email_date: contactEmails[0]?.email_date,
          last_deal_date: fuelDeals[0]?.deal_date,
          total_calls: contactCalls.length,
          total_emails: contactEmails.length,
          total_deals: fuelDeals.length,
          total_tasks: contactTasks.length,
          pending_tasks: contactTasks.filter(t => !t.completed).length,
          next_task_due: nextTask?.due_date,
          next_task_title: nextTask?.title,
          next_call_due,
          is_overdue,
          days_until_due,
        };
      });

      setContacts(contactsWithActivity);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async (contactData: Partial<ContactWithActivity>, contactPersons: Partial<ContactPerson>[]) => {
    try {
      console.log('Saving contact with data:', contactData);
      console.log('Saving contact with contact persons:', contactPersons);
      let contactId: string;

      if (contactData.id) {
        contactId = contactData.id;

        const updateData = {
          name: contactData.name,
          phone: contactData.phone,
          phone_type: contactData.phone_type,
          email: contactData.email,
          company: contactData.company,
          company_size: contactData.company_size,
          company_excerpt: contactData.company_excerpt,
          website: contactData.website,
          address: contactData.address,
          city: contactData.city,
          post_code: contactData.post_code,
          country: contactData.country,
          timezone: contactData.timezone,
          reminder_days: contactData.reminder_days,
          notes: contactData.notes,
          updated_at: new Date().toISOString(),
        };

        console.log('Updating contact with:', updateData);
        const { error } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', contactId);

        if (error) {
          console.error('Error updating contact:', error);
          throw error;
        }
        console.log('Contact updated successfully');

        await supabase.from('contact_persons').delete().eq('contact_id', contactId);
      } else {
        const insertData = {
          ...contactData,
          user_id: user?.id,
        };

        const { data, error } = await supabase
          .from('contacts')
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;
        contactId = data.id;
      }

      if (contactPersons.length > 0) {
        const personsToInsert = contactPersons.map(p => {
          const person: any = {
            user_id: user.id,
            contact_id: contactId,
            name: p.name!,
            job_title: p.job_title,
            phone: p.phone,
            phone_type: p.phone_type,
            mobile: p.mobile,
            mobile_type: p.mobile_type,
            email: p.email,
            is_primary: p.is_primary || false,
          };
          return person;
        });

        console.log('Inserting contact persons:', personsToInsert);
        const { error: personsError } = await supabase
          .from('contact_persons')
          .insert(personsToInsert);

        if (personsError) {
          console.error('Error inserting contact persons:', personsError);
          throw personsError;
        }
        console.log('Contact persons inserted successfully');
      }

      await loadContacts();
      console.log('Contact and PICs saved successfully');
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact. Please check console for details.');
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', id);

      if (error) throw error;
      await loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleUpdateContactStatus = async (contactId: string, statusField: 'is_jammed' | 'has_traction' | 'is_client', value: boolean) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ [statusField]: value })
        .eq('id', contactId);

      if (error) throw error;
      await loadContacts();

      const updatedContact = contacts.find(c => c.id === contactId);
      if (updatedContact && selectedContact?.id === contactId) {
        setSelectedContact(updatedContact);
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
    }
  };

  const handleDeleteAllContacts = async () => {
    if (!confirm('Are you sure you want to delete ALL contacts? This action cannot be undone.')) {
      return;
    }

    const confirmText = prompt('Type "DELETE ALL" to confirm:');
    if (confirmText !== 'DELETE ALL') {
      return;
    }

    try {
      const { data: allContacts } = await supabase.from('contacts').select('id');

      if (allContacts && allContacts.length > 0) {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .in('id', allContacts.map(c => c.id));

        if (error) throw error;
      }

      await loadContacts();
      alert('All contacts have been deleted.');
    } catch (error) {
      console.error('Error deleting all contacts:', error);
      alert('Failed to delete contacts. Please check console for details.');
    }
  };

  const handleSaveCall = async (callData: { id?: string; call_date: string; duration?: number; spoke_with?: string; phone_number?: string; notes?: string }) => {
    if (!selectedContact) return;

    try {
      if (callData.id) {
        const { id, ...updateData } = callData;
        const { error } = await supabase
          .from('calls')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('calls').insert([
          {
            user_id: user.id,
            contact_id: selectedContact.id,
            ...callData,
          },
        ]);

        if (error) throw error;
      }

      const { data: allCalls } = await supabase
        .from('calls')
        .select('call_date')
        .eq('contact_id', selectedContact.id)
        .order('call_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (allCalls) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ last_called: allCalls.call_date })
          .eq('id', selectedContact.id);

        if (updateError) throw updateError;
      }

      await loadContacts();

      const updatedContact = contacts.find(c => c.id === selectedContact.id);
      if (updatedContact) {
        setSelectedContact(updatedContact);
      }
      setEditingCall(undefined);
    } catch (error) {
      console.error('Error saving call:', error);
    }
  };

  const handleSaveEmail = async (emailData: { id?: string; email_date: string; subject?: string; emailed_to?: string; email_address?: string; notes?: string }) => {
    if (!selectedContact) return;

    try {
      if (emailData.id) {
        const { id, ...updateData } = emailData;
        const { error } = await supabase
          .from('emails')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('emails').insert([
          {
            user_id: user.id,
            contact_id: selectedContact.id,
            ...emailData,
          },
        ]);

        if (error) throw error;
      }

      const { data: allEmails } = await supabase
        .from('emails')
        .select('email_date')
        .eq('contact_id', selectedContact.id)
        .order('email_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (allEmails) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ last_emailed: allEmails.email_date })
          .eq('id', selectedContact.id);

        if (updateError) throw updateError;
      }

      await loadContacts();

      const updatedContact = contacts.find(c => c.id === selectedContact.id);
      if (updatedContact) {
        setSelectedContact(updatedContact);
      }
      setEditingEmail(undefined);
    } catch (error) {
      console.error('Error saving email:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('company_name');

      if (suppliersError) throw suppliersError;

      const { data: ordersData, error: ordersError} = await supabase
        .from('supplier_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (ordersError) throw ordersError;

      const { data: contactsData, error: contactsError } = await supabase
        .from('supplier_contacts')
        .select('*')
        .order('is_primary', { ascending: false });

      if (contactsError) throw contactsError;

      const suppliersWithOrders: SupplierWithOrders[] = (suppliersData || []).map((supplier) => {
        const supplierOrders = (ordersData || []).filter((order) => order.supplier_id === supplier.id);
        const supplierContacts = (contactsData || []).filter((contact) => contact.supplier_id === supplier.id);

        return {
          ...supplier,
          orders: supplierOrders,
          contacts: supplierContacts,
          total_orders: supplierOrders.length,
          last_order_date: supplierOrders[0]?.order_date,
        };
      });

      setSuppliers(suppliersWithOrders);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (contact: ContactWithActivity) => {
    setSelectedContact(contact);
    setShowContactDetail(true);
  };

  const handleEditContact = (contact: ContactWithActivity) => {
    console.log('Editing contact:', contact);
    console.log('Contact has', contact.contact_persons?.length || 0, 'PICs');
    setEditingContact(contact);
    setShowContactModal(true);
  };

  const loadNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setNotificationSettings(data);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleSaveNotificationSettings = async (settings: NotificationSettings) => {
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('notification_settings')
          .update({
            user_email: settings.user_email,
            days_before_reminder: settings.days_before_reminder,
            enabled: settings.enabled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_settings')
          .insert([settings]);

        if (error) throw error;
      }

      await loadNotificationSettings();
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const handleImportContacts = async (importedContacts: Partial<ContactWithActivity>[]) => {
    try {
      const contactsToInsert = importedContacts.map(c => {
        const timezone = c.timezone || getTimezoneForCountry(c.country);
        return {
          user_id: user.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          company: c.company,
          company_excerpt: c.company_excerpt,
          website: c.website,
          address: c.address,
          city: c.city,
          post_code: c.post_code,
          country: c.country,
          timezone: timezone,
          reminder_days: c.reminder_days,
          notes: c.notes,
        };
      });

      const { error } = await supabase.from('contacts').insert(contactsToInsert);

      if (error) throw error;
      await loadContacts();
    } catch (error) {
      console.error('Error importing contacts:', error);
      throw error;
    }
  };

  const handleExportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const contactsData = contacts.map(contact => ({
      'Name': contact.name,
      'Company': contact.company || '',
      'Company Size': contact.company_size || '',
      'Company Excerpt': contact.company_excerpt || '',
      'Email': contact.email || '',
      'Phone': contact.phone || '',
      'Phone Type': contact.phone_type || '',
      'City': contact.city || '',
      'Post Code': contact.post_code || '',
      'Address': contact.address || '',
      'Country': contact.country || '',
      'Timezone': contact.timezone || '',
      'Website': contact.website || '',
      'Reminder Days': contact.reminder_days || '',
      'Has Traction': contact.has_traction ? 'Yes' : 'No',
      'Is Client': contact.is_client ? 'Yes' : 'No',
      'Is Jammed': contact.is_jammed ? 'Yes' : 'No',
      'Total Calls': contact.total_calls || 0,
      'Total Emails': contact.total_emails || 0,
      'Total Deals': contact.total_deals || 0,
      'Total Tasks': contact.total_tasks || 0,
      'Pending Tasks': contact.pending_tasks || 0,
      'Last Called': contact.last_called ? new Date(contact.last_called).toLocaleDateString() : '',
      'Last Emailed': contact.last_emailed ? new Date(contact.last_emailed).toLocaleDateString() : '',
      'Last Call Date': contact.last_call_date ? new Date(contact.last_call_date).toLocaleDateString() : '',
      'Last Email Date': contact.last_email_date ? new Date(contact.last_email_date).toLocaleDateString() : '',
      'Last Deal Date': contact.last_deal_date ? new Date(contact.last_deal_date).toLocaleDateString() : '',
      'Next Task Due': contact.next_task_due ? new Date(contact.next_task_due).toLocaleDateString() : '',
      'Next Task Title': contact.next_task_title || '',
      'Notes': contact.notes || '',
    }));

    const contactPersonsData: any[] = [];
    contacts.forEach(contact => {
      if (contact.contact_persons && contact.contact_persons.length > 0) {
        contact.contact_persons.forEach(person => {
          contactPersonsData.push({
            'Contact Name': contact.name,
            'Person Name': person.name,
            'Job Title': person.job_title || '',
            'Email': person.email || '',
            'Phone': person.phone || '',
            'Phone Type': person.phone_type || '',
            'Mobile': person.mobile || '',
            'Mobile Type': person.mobile_type || '',
            'Is Primary': person.is_primary ? 'Yes' : 'No',
          });
        });
      }
    });

    const callsData = allCalls.map(call => {
      const contact = contacts.find(c => c.id === call.contact_id);
      return {
        'Contact Name': contact?.name || '',
        'Company': contact?.company || '',
        'Call Date': new Date(call.call_date).toLocaleString(),
        'Duration (min)': call.duration || '',
        'Spoke With': call.spoke_with || '',
        'Phone Number': call.phone_number || '',
        'Notes': call.notes || '',
      };
    });

    const emailsData = allEmails.map(email => {
      const contact = contacts.find(c => c.id === email.contact_id);
      return {
        'Contact Name': contact?.name || '',
        'Company': contact?.company || '',
        'Email Date': new Date(email.email_date).toLocaleString(),
        'Subject': email.subject || '',
        'Emailed To': email.emailed_to || '',
        'Email Address': email.email_address || '',
        'Notes': email.notes || '',
      };
    });

    const vesselsData: any[] = [];
    contacts.forEach(contact => {
      if (contact.vessels && contact.vessels.length > 0) {
        contact.vessels.forEach(vessel => {
          vesselsData.push({
            'Contact Name': contact.name,
            'Company': contact.company || '',
            'Vessel Name': vessel.vessel_name || '',
            'IMO Number': vessel.imo_number || '',
            'Vessel Type': vessel.vessel_type || '',
            'Flag': vessel.flag || '',
            'Year Built': vessel.year_built || '',
            'DWT': vessel.dwt || '',
            'Notes': vessel.notes || '',
          });
        });
      }
    });

    const fuelDealsData: any[] = [];
    contacts.forEach(contact => {
      if (contact.fuel_deals && contact.fuel_deals.length > 0) {
        contact.fuel_deals.forEach(deal => {
          const vessel = contact.vessels?.find(v => v.id === deal.vessel_id);
          fuelDealsData.push({
            'Contact Name': contact.name,
            'Company': contact.company || '',
            'Vessel Name': vessel?.vessel_name || '',
            'Deal Date': new Date(deal.deal_date).toLocaleDateString(),
            'Port': deal.port || '',
            'Fuel Type': deal.fuel_type || '',
            'Quantity (MT)': deal.quantity || '',
            'Price per MT': deal.price_per_mt || '',
            'Currency': deal.currency || '',
            'Total Amount': deal.total_amount || '',
            'Notes': deal.notes || '',
          });
        });
      }
    });

    const suppliersData = suppliers.map(supplier => ({
      'Company Name': supplier.company_name,
      'Contact Person': supplier.contact_person || '',
      'Email': supplier.email || '',
      'Phone': supplier.phone || '',
      'Address': supplier.address || '',
      'Country': supplier.country || '',
      'Supplier Type': supplier.supplier_type || '',
      'Ports': supplier.ports || '',
      'Fuel Types': supplier.fuel_types || '',
      'Payment Terms': supplier.payment_terms || '',
      'Currency': supplier.currency || '',
      'Total Orders': supplier.total_orders || 0,
      'Last Order Date': supplier.last_order_date ? new Date(supplier.last_order_date).toLocaleDateString() : '',
      'Notes': supplier.notes || '',
    }));

    const supplierContactsData: any[] = [];
    suppliers.forEach(supplier => {
      if (supplier.contacts && supplier.contacts.length > 0) {
        supplier.contacts.forEach(contact => {
          supplierContactsData.push({
            'Supplier Name': supplier.company_name,
            'Contact Name': contact.name,
            'Job Title': contact.job_title || '',
            'Email': contact.email || '',
            'Phone': contact.phone || '',
            'Phone Type': contact.phone_type || '',
            'Mobile': contact.mobile || '',
            'Mobile Type': contact.mobile_type || '',
            'Is Primary': contact.is_primary ? 'Yes' : 'No',
          });
        });
      }
    });

    const ordersData: any[] = [];
    suppliers.forEach(supplier => {
      if (supplier.orders && supplier.orders.length > 0) {
        supplier.orders.forEach(order => {
          ordersData.push({
            'Supplier Name': supplier.company_name,
            'Order Date': new Date(order.order_date).toLocaleDateString(),
            'Order Number': order.order_number || '',
            'Description': order.description || '',
            'Quantity': order.quantity || '',
            'Unit Price': order.unit_price || '',
            'Total Amount': order.total_amount || '',
            'Currency': order.currency || '',
            'Status': order.status || '',
            'Delivery Date': order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '',
            'Notes': order.notes || '',
          });
        });
      }
    });

    const tasksData = tasks.map(task => ({
      'Title': task.title,
      'Contact Name': task.contact?.name || '',
      'Supplier Name': task.supplier?.company_name || '',
      'Due Date': task.due_date ? new Date(task.due_date).toLocaleString() : '',
      'Completed': task.completed ? 'Yes' : 'No',
      'Completed At': task.completed_at ? new Date(task.completed_at).toLocaleString() : '',
      'Priority': task.priority || 'medium',
      'Is Overdue': task.is_overdue ? 'Yes' : 'No',
      'Days Until Due': task.days_until_due || '',
      'Notes': task.notes || '',
      'Created At': new Date(task.created_at).toLocaleString(),
    }));

    const contactsSheet = XLSX.utils.json_to_sheet(contactsData);
    XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Contacts');

    if (contactPersonsData.length > 0) {
      const contactPersonsSheet = XLSX.utils.json_to_sheet(contactPersonsData);
      XLSX.utils.book_append_sheet(workbook, contactPersonsSheet, 'Contact Persons');
    }

    if (callsData.length > 0) {
      const callsSheet = XLSX.utils.json_to_sheet(callsData);
      XLSX.utils.book_append_sheet(workbook, callsSheet, 'Calls');
    }

    if (emailsData.length > 0) {
      const emailsSheet = XLSX.utils.json_to_sheet(emailsData);
      XLSX.utils.book_append_sheet(workbook, emailsSheet, 'Emails');
    }

    if (vesselsData.length > 0) {
      const vesselsSheet = XLSX.utils.json_to_sheet(vesselsData);
      XLSX.utils.book_append_sheet(workbook, vesselsSheet, 'Vessels');
    }

    if (fuelDealsData.length > 0) {
      const fuelDealsSheet = XLSX.utils.json_to_sheet(fuelDealsData);
      XLSX.utils.book_append_sheet(workbook, fuelDealsSheet, 'Fuel Deals');
    }

    const suppliersSheet = XLSX.utils.json_to_sheet(suppliersData);
    XLSX.utils.book_append_sheet(workbook, suppliersSheet, 'Suppliers');

    if (supplierContactsData.length > 0) {
      const supplierContactsSheet = XLSX.utils.json_to_sheet(supplierContactsData);
      XLSX.utils.book_append_sheet(workbook, supplierContactsSheet, 'Supplier Contacts');
    }

    if (ordersData.length > 0) {
      const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
      XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');
    }

    if (tasksData.length > 0) {
      const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
      XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');
    }

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `CRM_Export_${timestamp}.xlsx`);
  };

  const handleSaveVessel = async (vesselData: Partial<Vessel>) => {
    if (!selectedContact) return;

    try {
      if (vesselData.id) {
        const { error } = await supabase
          .from('vessels')
          .update(vesselData)
          .eq('id', vesselData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('vessels').insert([
          {
            user_id: user.id,
            contact_id: selectedContact.id,
            ...vesselData,
          },
        ]);

        if (error) throw error;
      }

      await loadContacts();
      const updatedContact = contacts.find(c => c.id === selectedContact.id);
      if (updatedContact) {
        setSelectedContact(updatedContact);
      }
      setEditingVessel(undefined);
    } catch (error) {
      console.error('Error saving vessel:', error);
    }
  };

  const handleDeleteVessel = async (vesselId: string) => {
    try {
      const { error } = await supabase.from('vessels').delete().eq('id', vesselId);

      if (error) throw error;
      await loadContacts();

      if (selectedContact) {
        const updatedContact = contacts.find(c => c.id === selectedContact.id);
        if (updatedContact) {
          setSelectedContact(updatedContact);
        }
      }
    } catch (error) {
      console.error('Error deleting vessel:', error);
    }
  };

  const handleSaveFuelDeal = async (dealData: Partial<FuelDeal>) => {
    if (!selectedContact) return;

    try {
      if (dealData.id) {
        const { error } = await supabase
          .from('fuel_deals')
          .update(dealData)
          .eq('id', dealData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('fuel_deals').insert([
          {
            user_id: user.id,
            contact_id: selectedContact.id,
            ...dealData,
          },
        ]);

        if (error) throw error;
      }

      await loadContacts();
      const updatedContact = contacts.find(c => c.id === selectedContact.id);
      if (updatedContact) {
        setSelectedContact(updatedContact);
      }
      setEditingFuelDeal(undefined);
    } catch (error) {
      console.error('Error saving fuel deal:', error);
    }
  };

  const handleDeleteFuelDeal = async (dealId: string) => {
    try {
      const { error } = await supabase.from('fuel_deals').delete().eq('id', dealId);

      if (error) throw error;
      await loadContacts();

      if (selectedContact) {
        const updatedContact = contacts.find(c => c.id === selectedContact.id);
        if (updatedContact) {
          setSelectedContact(updatedContact);
        }
      }
    } catch (error) {
      console.error('Error deleting fuel deal:', error);
    }
  };

  const handleSaveSupplier = async (supplierData: Partial<Supplier>) => {
    try {
      if (supplierData.id) {
        const { error } = await supabase
          .from('suppliers')
          .update({ ...supplierData, updated_at: new Date().toISOString() })
          .eq('id', supplierData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('suppliers').insert([{
          user_id: user.id,
          ...supplierData
        }]);

        if (error) throw error;
      }

      await loadSuppliers();
      setEditingSupplier(undefined);
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);

      if (error) throw error;
      await loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const handleSupplierClick = (supplier: SupplierWithOrders) => {
    setSelectedSupplier(supplier);
    setShowSupplierDetail(true);
  };

  const handleEditSupplier = (supplier: SupplierWithOrders) => {
    setEditingSupplier(supplier);
    setShowSupplierModal(true);
  };

  const handleImportSuppliers = async (importedSuppliers: any[]) => {
    try {
      const suppliersToInsert = importedSuppliers.map(s => ({
        user_id: user.id,
        company_name: s['Supplier Name'],
        ports: s['Ports'] || null,
        address: s['Address'] || null,
        notes: s['Notes'] || null,
        payment_terms: s['Usual Payment Terms'] || null,
        general_email: s['Emails'] || null,
        phone: s['Phone Number'] || null,
        country: s['Country'] || null,
        website: s['Website'] || null,
        currency: s['Currency'] || 'USD',
        supplier_type: s['Supplier Type'] || null,
        fuel_types: s['Fuel Types'] || null,
      }));

      const { error } = await supabase.from('suppliers').insert(suppliersToInsert);

      if (error) throw error;
      await loadSuppliers();
    } catch (error) {
      console.error('Error importing suppliers:', error);
      throw error;
    }
  };

  const handleExportSuppliers = () => {
    const workbook = XLSX.utils.book_new();

    const suppliersData = suppliers.map(supplier => ({
      'Supplier Name': supplier.company_name,
      'Ports': supplier.ports || '',
      'Address': supplier.address || '',
      'Notes': supplier.notes || '',
      'Usual Payment Terms': supplier.payment_terms || '',
      'Emails': supplier.general_email || '',
      'Phone Number': supplier.phone || '',
      'Country': supplier.country || '',
      'Website': supplier.website || '',
      'Currency': supplier.currency || '',
      'Supplier Type': supplier.supplier_type || '',
      'Fuel Types': supplier.fuel_types || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(suppliersData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');

    XLSX.writeFile(workbook, `suppliers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSaveOrder = async (orderData: Partial<SupplierOrder>) => {
    if (!selectedSupplier) return;

    try {
      if (orderData.id) {
        const { error } = await supabase
          .from('supplier_orders')
          .update(orderData)
          .eq('id', orderData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('supplier_orders').insert([
          {
            user_id: user.id,
            supplier_id: selectedSupplier.id,
            ...orderData,
          },
        ]);

        if (error) throw error;
      }

      await loadSuppliers();
      const updatedSupplier = suppliers.find(s => s.id === selectedSupplier.id);
      if (updatedSupplier) {
        setSelectedSupplier(updatedSupplier);
      }
      setEditingOrder(undefined);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from('supplier_orders').delete().eq('id', orderId);

      if (error) throw error;
      await loadSuppliers();

      if (selectedSupplier) {
        const updatedSupplier = suppliers.find(s => s.id === selectedSupplier.id);
        if (updatedSupplier) {
          setSelectedSupplier(updatedSupplier);
        }
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handleSaveSupplierContact = async (contactData: Partial<SupplierContact>) => {
    if (!selectedSupplier) return;

    try {
      if (contactData.id) {
        const { error } = await supabase
          .from('supplier_contacts')
          .update(contactData)
          .eq('id', contactData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('supplier_contacts').insert([
          {
            user_id: user.id,
            supplier_id: selectedSupplier.id,
            ...contactData,
          },
        ]);

        if (error) throw error;
      }

      await loadSuppliers();
      const updatedSupplier = suppliers.find(s => s.id === selectedSupplier.id);
      if (updatedSupplier) {
        setSelectedSupplier(updatedSupplier);
      }
      setEditingSupplierContact(undefined);
    } catch (error) {
      console.error('Error saving supplier contact:', error);
    }
  };

  const handleDeleteSupplierContact = async (contactId: string) => {
    try {
      const { error } = await supabase.from('supplier_contacts').delete().eq('id', contactId);

      if (error) throw error;
      await loadSuppliers();

      if (selectedSupplier) {
        const updatedSupplier = suppliers.find(s => s.id === selectedSupplier.id);
        if (updatedSupplier) {
          setSelectedSupplier(updatedSupplier);
        }
      }
    } catch (error) {
      console.error('Error deleting supplier contact:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;

      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*');

      if (contactsError) throw contactsError;

      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*');

      if (suppliersError) throw suppliersError;

      const now = new Date();
      const tasksWithRelated: TaskWithRelated[] = (tasksData || []).map((task) => {
        const contact = (contactsData || []).find((c) => c.id === task.contact_id);
        const supplier = (suppliersData || []).find((s) => s.id === task.supplier_id);

        let is_overdue = false;
        let days_until_due: number | undefined;

        if (task.due_date && !task.completed) {
          const dueDate = new Date(task.due_date);
          const diffTime = dueDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          days_until_due = diffDays;
          is_overdue = diffDays < 0;
        }

        return {
          ...task,
          contact,
          supplier,
          is_overdue,
          days_until_due,
        };
      });

      setTasks(tasksWithRelated);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (taskData.id) {
        const { id, ...updateData } = taskData;
        const { error } = await supabase
          .from('tasks')
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').insert([{
          user_id: user.id,
          ...taskData
        }]);

        if (error) throw error;
      }

      await loadTasks();
      await loadContacts();
      await loadSuppliers();
      setShowTaskModal(false);
      setEditingTask(undefined);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleToggleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const updateData: any = {
        completed,
        updated_at: new Date().toISOString(),
      };

      if (completed) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      await loadTasks();
      await loadContacts();
      await loadSuppliers();
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) throw error;
      await loadTasks();
      await loadContacts();
      await loadSuppliers();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = (task: TaskWithRelated) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleAddTaskForContact = (contactId: string) => {
    setEditingTask(undefined);
    setPreselectedContactId(contactId);
    setPreselectedSupplierId(undefined);
    setShowTaskModal(true);
  };

  const handleAddTaskForSupplier = (supplierId: string) => {
    setEditingTask(undefined);
    setPreselectedSupplierId(supplierId);
    setPreselectedContactId(undefined);
    setShowTaskModal(true);
  };

  const handleSelectContactFromGoals = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setSelectedContact(contact);
      setShowContactDetail(true);
    }
  };

  const loadButtonOrder = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('button_order, visible_filters')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        if (data.button_order) {
          setButtonOrder(data.button_order);
        }
        if (data.visible_filters) {
          setVisibleFilters(data.visible_filters as typeof visibleFilters);
        }
      }
    } catch (error) {
      console.error('Error loading button order:', error);
    }
  };

  const handleSaveButtonOrder = async (order: string[]) => {
    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ button_order: order })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert([{ user_id: user.id, button_order: order }]);

        if (error) throw error;
      }

      setButtonOrder(order);
    } catch (error) {
      console.error('Error saving button order:', error);
    }
  };

  const handleSaveVisibleFilters = async (filters: typeof visibleFilters) => {
    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ visible_filters: filters })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert([{ user_id: user.id, visible_filters: filters }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving visible filters:', error);
    }
  };

  const handleCopyAllEmails = () => {
    const emails = filteredContacts
      .map(c => c.email)
      .filter(Boolean)
      .join('; ');

    if (emails) {
      navigator.clipboard.writeText(emails).then(() => {
        alert(`Copied ${filteredContacts.filter(c => c.email).length} email addresses to clipboard!`);
      }).catch(() => {
        alert('Failed to copy emails. Please try again.');
      });
    } else {
      alert('No email addresses found in filtered contacts.');
    }
  };

  const handleCopyAllSupplierEmails = () => {
    const emails = filteredSuppliers
      .map(s => s.general_email || s.email)
      .filter(Boolean)
      .join('; ');

    if (emails) {
      navigator.clipboard.writeText(emails).then(() => {
        alert(`Copied ${filteredSuppliers.filter(s => s.general_email || s.email).length} email addresses to clipboard!`);
      }).catch(() => {
        alert('Failed to copy emails. Please try again.');
      });
    } else {
      alert('No email addresses found in filtered suppliers.');
    }
  };

  const renderContactButtons = () => {
    const buttonComponents: Record<string, JSX.Element> = {
      'copy-emails': (
        <button
          key="copy-emails"
          onClick={handleCopyAllEmails}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Copy className="w-5 h-5" />
          Copy Emails
        </button>
      ),
      'export': (
        <button
          key="export"
          onClick={handleExportToExcel}
          className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Download className="w-5 h-5" />
          Export Excel
        </button>
      ),
      'history': (
        <button
          key="history"
          onClick={() => setShowCommunicationsHistory(true)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <History className="w-5 h-5" />
          History
        </button>
      ),
      'delete-all': (
        <button
          key="delete-all"
          onClick={handleDeleteAllContacts}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Trash2 className="w-5 h-5" />
          Delete All
        </button>
      ),
      'duplicates': (
        <button
          key="duplicates"
          onClick={() => setShowDuplicatesModal(true)}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Users className="w-5 h-5" />
          Duplicates
        </button>
      ),
      'settings': (
        <button
          key="settings"
          onClick={() => setShowSettingsModal(true)}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Settings className="w-5 h-5" />
          Settings
        </button>
      ),
      'import': (
        <button
          key="import"
          onClick={() => setShowImportModal(true)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Upload className="w-5 h-5" />
          Import Excel
        </button>
      ),
      'add-contact': (
        <button
          key="add-contact"
          onClick={() => {
            setEditingContact(undefined);
            setShowContactModal(true);
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Contact
        </button>
      ),
    };

    return (
      <>
        <button
          onClick={() => setShowButtonOrderSettings(true)}
          className="px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          title="Organize Buttons"
        >
          <ArrowUpDown className="w-5 h-5" />
        </button>
        {buttonOrder.map(id => buttonComponents[id]).filter(Boolean)}
      </>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <GlobalGoalNotifications />
      {showGoalProgressBox && <GoalProgressBox onSelectContact={handleSelectContactFromGoals} />}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                currentPage === 'contacts' ? 'bg-blue-600' :
                currentPage === 'suppliers' ? 'bg-green-600' :
                'bg-orange-600'
              }`}>
                {currentPage === 'contacts' ? (
                  <Users className="w-8 h-8 text-white" />
                ) : currentPage === 'suppliers' ? (
                  <Package className="w-8 h-8 text-white" />
                ) : (
                  <CheckSquare className="w-8 h-8 text-white" />
                )}
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
                {currentPage === 'contacts' ? 'Contact Tracker' :
                 currentPage === 'suppliers' ? 'Supplier Tracker' :
                 'Task Manager'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newValue = !showGoalProgressBox;
                  setShowGoalProgressBox(newValue);
                  localStorage.setItem('goalProgressBoxVisible', String(newValue));
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showGoalProgressBox
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
                title={showGoalProgressBox ? 'Hide Goals' : 'Show Goals'}
              >
                <Target className="w-5 h-5" />
                <span className="hidden sm:inline">Goals</span>
              </button>
              <button
                onClick={() => setShowAccountSettings(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                title="Account Settings"
              >
                <UserCog className="w-5 h-5" />
                <span className="hidden sm:inline">Account</span>
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
          <p className="text-gray-600 ml-16">
            {currentPage === 'contacts'
              ? 'Manage your contacts and track your calls and emails'
              : currentPage === 'suppliers'
              ? 'Manage your suppliers and track purchase orders'
              : 'Manage your tasks and stay on top of follow-ups'}
          </p>
        </div>

        <div className="mb-6 flex gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200 w-fit">
          <button
            onClick={() => {
              setCurrentPage('contacts');
              setSearchQuery('');
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentPage === 'contacts'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Contacts
          </button>
          <button
            onClick={() => {
              setCurrentPage('suppliers');
              setSearchQuery('');
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentPage === 'suppliers'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Suppliers
          </button>
          <button
            onClick={() => {
              setCurrentPage('tasks');
              setSearchQuery('');
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentPage === 'tasks'
                ? 'bg-orange-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Tasks
          </button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={
                currentPage === 'contacts' ? 'Search contacts...' :
                currentPage === 'suppliers' ? 'Search suppliers...' :
                'Search tasks...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
          {currentPage !== 'tasks' && (
            <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'grid'
                    ? currentPage === 'contacts'
                      ? 'bg-blue-600 text-white'
                      : 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'table'
                    ? currentPage === 'contacts'
                      ? 'bg-blue-600 text-white'
                      : 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Table View"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
          )}
          {currentPage === 'contacts' ? (
            renderContactButtons()
          ) : currentPage === 'suppliers' ? (
            <div className="flex gap-2">
              <button
                onClick={handleCopyAllSupplierEmails}
                className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Copy className="w-5 h-5" />
                Copy Emails
              </button>
              <button
                onClick={() => setShowSupplierImportModal(true)}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Upload className="w-5 h-5" />
                Import
              </button>
              <button
                onClick={handleExportSuppliers}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
              <button
                onClick={() => {
                  setEditingSupplier(undefined);
                  setShowSupplierModal(true);
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Add Supplier
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditingTask(undefined);
                setShowTaskModal(true);
              }}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          )}
        </div>

        {currentPage === 'contacts' && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Filter & Sort</h3>
              </div>
              <button
                onClick={() => setShowFilterSettings(!showFilterSettings)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                {showFilterSettings ? 'Hide' : 'Show'} Filter Settings
              </button>
            </div>

            {showFilterSettings && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Visible Filters</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries({
                    name: 'Name',
                    company: 'Company',
                    companySize: 'Company Size',
                    email: 'Email',
                    phone: 'Phone',
                    city: 'City',
                    postCode: 'Post Code',
                    website: 'Website',
                    address: 'Address',
                    country: 'Country',
                    timezone: 'Timezone'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={visibleFilters[key as keyof typeof visibleFilters]}
                        onChange={(e) => {
                          const newFilters = { ...visibleFilters, [key]: e.target.checked };
                          setVisibleFilters(newFilters);
                          handleSaveVisibleFilters(newFilters);
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilters(prev => ({ ...prev, hasTraction: !prev.hasTraction }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilters.hasTraction
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Has Traction
                </button>
                <button
                  onClick={() => setStatusFilters(prev => ({ ...prev, isClient: !prev.isClient }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilters.isClient
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Is Client
                </button>
                <button
                  onClick={() => setStatusFilters(prev => ({ ...prev, isJammed: !prev.isJammed }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilters.isJammed
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Is Jammed
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {visibleFilters.name && (
                <MultiSelectDropdown
                  label="Name"
                  options={Array.from(new Set(contacts.map((c) => c.name).filter(Boolean))).sort()}
                  selectedValues={filterNames}
                  onChange={setFilterNames}
                  placeholder="Select names..."
                />
              )}

              {visibleFilters.company && (
                <MultiSelectDropdown
                  label="Company"
                  options={Array.from(new Set(contacts.map((c) => c.company).filter(Boolean) as string[])).sort()}
                  selectedValues={filterCompanies}
                  onChange={setFilterCompanies}
                  placeholder="Select companies..."
                />
              )}

              {visibleFilters.companySize && (
                <MultiSelectDropdown
                  label="Company Size"
                  options={Array.from(new Set(contacts.map((c) => c.company_size).filter(Boolean) as string[])).sort()}
                  selectedValues={filterCompanySizes}
                  onChange={setFilterCompanySizes}
                  placeholder="Select company sizes..."
                />
              )}

              {visibleFilters.email && (
                <MultiSelectDropdown
                  label="Email"
                  options={Array.from(new Set(contacts.map((c) => c.email).filter(Boolean) as string[])).sort()}
                  selectedValues={filterEmails}
                  onChange={setFilterEmails}
                  placeholder="Select emails..."
                />
              )}

              {visibleFilters.phone && (
                <MultiSelectDropdown
                  label="Phone"
                  options={Array.from(new Set(contacts.map((c) => c.phone).filter(Boolean) as string[])).sort()}
                  selectedValues={filterPhones}
                  onChange={setFilterPhones}
                  placeholder="Select phones..."
                />
              )}

              {visibleFilters.city && (
                <MultiSelectDropdown
                  label="City"
                  options={Array.from(new Set(contacts.map((c) => c.city).filter(Boolean) as string[])).sort()}
                  selectedValues={filterCities}
                  onChange={setFilterCities}
                  placeholder="Select cities..."
                />
              )}

              {visibleFilters.postCode && (
                <MultiSelectDropdown
                  label="Post Code"
                  options={Array.from(new Set(contacts.map((c) => c.post_code).filter(Boolean) as string[])).sort()}
                  selectedValues={filterPostCodes}
                  onChange={setFilterPostCodes}
                  placeholder="Select post codes..."
                />
              )}

              {visibleFilters.website && (
                <MultiSelectDropdown
                  label="Website"
                  options={Array.from(new Set(contacts.map((c) => c.website).filter(Boolean) as string[])).sort()}
                  selectedValues={filterWebsites}
                  onChange={setFilterWebsites}
                  placeholder="Select websites..."
                />
              )}

              {visibleFilters.address && (
                <MultiSelectDropdown
                  label="Address"
                  options={Array.from(new Set(contacts.map((c) => c.address).filter(Boolean) as string[])).sort()}
                  selectedValues={filterAddresses}
                  onChange={setFilterAddresses}
                  placeholder="Select addresses..."
                />
              )}

              {visibleFilters.country && (
                <MultiSelectDropdown
                  label="Country"
                  options={Array.from(new Set(contacts.map((c) => c.country).filter(Boolean) as string[])).sort()}
                  selectedValues={filterCountries}
                  onChange={setFilterCountries}
                  placeholder="Select countries..."
                />
              )}

              {visibleFilters.timezone && (
                <MultiSelectDropdown
                  label="Timezone"
                  options={Array.from(new Set(contacts.map((c) => c.timezone).filter(Boolean) as string[])).sort()}
                  selectedValues={filterTimezones}
                  onChange={setFilterTimezones}
                  placeholder="Select timezones..."
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="name">Name</option>
                  <option value="company">Company</option>
                  <option value="country">Country</option>
                  <option value="timezone">Timezone</option>
                  <option value="recent-activity">Most Recent Activity</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Filter
                </label>
                <select
                  value={activityDateFilter}
                  onChange={(e) => setActivityDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="3days">Past 3 Days</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="3months">Past 3 Months</option>
                  <option value="6months">Past 6 Months</option>
                  <option value="year">Past Year</option>
                </select>
              </div>
            </div>
          {(filterNames.length > 0 || filterCompanies.length > 0 || filterCompanySizes.length > 0 || filterEmails.length > 0 || filterPhones.length > 0 || filterCities.length > 0 || filterPostCodes.length > 0 || filterWebsites.length > 0 || filterAddresses.length > 0 || filterCountries.length > 0 || filterTimezones.length > 0 || statusFilters.hasTraction || statusFilters.isClient || statusFilters.isJammed || activityDateFilter !== 'all') && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing {filteredContacts.length} of {contacts.length} contacts
              </span>
              <button
                onClick={() => {
                  setFilterNames([]);
                  setFilterCompanies([]);
                  setFilterCompanySizes([]);
                  setFilterEmails([]);
                  setFilterPhones([]);
                  setFilterCities([]);
                  setFilterPostCodes([]);
                  setFilterWebsites([]);
                  setFilterAddresses([]);
                  setFilterCountries([]);
                  setFilterTimezones([]);
                  setStatusFilters({ hasTraction: false, isClient: false, isJammed: false });
                  setActivityDateFilter('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            </div>
          )}
          </div>
        )}

        {currentPage === 'suppliers' && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Filter Suppliers</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <select
                  value={filterPort}
                  onChange={(e) => setFilterPort(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Ports</option>
                  {Array.from(new Set(
                    suppliers
                      .flatMap((s) => s.ports?.split(';').map(p => p.trim()) || [])
                      .filter(Boolean)
                  )).sort().map((port) => (
                    <option key={port} value={port}>
                      {port}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type
                </label>
                <select
                  value={filterFuelType}
                  onChange={(e) => setFilterFuelType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Fuel Types</option>
                  {Array.from(new Set(
                    suppliers
                      .flatMap((s) => s.fuel_types?.split(';').map(f => f.trim()) || [])
                      .filter(Boolean)
                  )).sort().map((fuelType) => (
                    <option key={fuelType} value={fuelType}>
                      {fuelType}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(filterPort !== 'all' || filterFuelType !== 'all') && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {filteredSuppliers.length} of {suppliers.length} suppliers
                </span>
                <button
                  onClick={() => {
                    setFilterPort('all');
                    setFilterFuelType('all');
                  }}
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {currentPage === 'tasks' && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Filter Tasks</h3>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setTaskFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  taskFilter === 'all'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Tasks ({tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  taskFilter === 'pending'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({tasks.filter(t => !t.completed).length})
              </button>
              <button
                onClick={() => setTaskFilter('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  taskFilter === 'completed'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed ({tasks.filter(t => t.completed).length})
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : currentPage === 'contacts' ? (
          viewMode === 'grid' ? (
            <ContactList
              contacts={filteredContacts}
              onContactClick={handleContactClick}
              onDeleteContact={handleDeleteContact}
              onEditContact={handleEditContact}
            />
          ) : (
            <ContactTableView
              contacts={filteredContacts}
              onContactClick={handleContactClick}
              onDeleteContact={handleDeleteContact}
              onEditContact={handleEditContact}
            />
          )
        ) : currentPage === 'suppliers' ? (
          viewMode === 'grid' ? (
            <SupplierList
              suppliers={filteredSuppliers}
              onSupplierClick={handleSupplierClick}
              onDeleteSupplier={handleDeleteSupplier}
              onEditSupplier={handleEditSupplier}
            />
          ) : (
            <SupplierTableView
              suppliers={filteredSuppliers}
              onSupplierClick={handleSupplierClick}
              onDeleteSupplier={handleDeleteSupplier}
              onEditSupplier={handleEditSupplier}
            />
          )
        ) : (
          <>
            <DailyGoals
              calls={contacts.flatMap(c => c.calls)}
              emails={contacts.flatMap(c => c.emails)}
              deals={contacts.flatMap(c => c.fuel_deals)}
              contacts={contacts}
            />
            <TaskList
              tasks={filteredTasks}
              onToggleComplete={handleToggleTaskComplete}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
            />
          </>
        )}
      </div>

      {showContactModal && (
        <ContactModal
          contact={editingContact}
          onClose={() => {
            setShowContactModal(false);
            setEditingContact(undefined);
          }}
          onSave={handleSaveContact}
        />
      )}

      {showContactDetail && selectedContact && (
        <ContactDetail
          contact={selectedContact}
          tasks={tasks.filter(t => t.contact_id === selectedContact.id)}
          onClose={() => {
            setShowContactDetail(false);
            setSelectedContact(undefined);
            loadContacts();
          }}
          onLogCall={() => {
            setEditingCall(undefined);
            setShowCallModal(true);
          }}
          onLogEmail={() => {
            setEditingEmail(undefined);
            setShowEmailModal(true);
          }}
          onEditCall={(call) => {
            setEditingCall(call);
            setShowCallModal(true);
          }}
          onEditEmail={(email) => {
            setEditingEmail(email);
            setShowEmailModal(true);
          }}
          onAddVessel={() => {
            setEditingVessel(undefined);
            setShowVesselModal(true);
          }}
          onEditVessel={(vessel) => {
            setEditingVessel(vessel);
            setShowVesselModal(true);
          }}
          onDeleteVessel={handleDeleteVessel}
          onAddFuelDeal={() => {
            setEditingFuelDeal(undefined);
            setShowFuelDealModal(true);
          }}
          onEditFuelDeal={(deal) => {
            setEditingFuelDeal(deal);
            setShowFuelDealModal(true);
          }}
          onDeleteFuelDeal={handleDeleteFuelDeal}
          onUpdateStatus={(statusField, value) => handleUpdateContactStatus(selectedContact.id, statusField, value)}
          onAddTask={() => handleAddTaskForContact(selectedContact.id)}
          onToggleTaskComplete={handleToggleTaskComplete}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {showVesselModal && selectedContact && (
        <VesselModal
          vessel={editingVessel}
          contactName={selectedContact.name}
          onClose={() => {
            setShowVesselModal(false);
            setEditingVessel(undefined);
          }}
          onSave={handleSaveVessel}
        />
      )}

      {showFuelDealModal && selectedContact && (
        <FuelDealModal
          deal={editingFuelDeal}
          vessels={selectedContact.vessels || []}
          contactName={selectedContact.name}
          onClose={() => {
            setShowFuelDealModal(false);
            setEditingFuelDeal(undefined);
          }}
          onSave={handleSaveFuelDeal}
        />
      )}

      {showCallModal && selectedContact && (
        <CallModal
          call={editingCall}
          contactName={selectedContact.name}
          onClose={() => {
            setShowCallModal(false);
            setEditingCall(undefined);
          }}
          onSave={handleSaveCall}
        />
      )}

      {showEmailModal && selectedContact && (
        <EmailModal
          email={editingEmail}
          contactName={selectedContact.name}
          onClose={() => {
            setShowEmailModal(false);
            setEditingEmail(undefined);
          }}
          onSave={handleSaveEmail}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportContacts}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveNotificationSettings}
          currentSettings={notificationSettings}
        />
      )}

      {showSupplierModal && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => {
            setShowSupplierModal(false);
            setEditingSupplier(undefined);
          }}
          onSave={handleSaveSupplier}
        />
      )}

      {showSupplierDetail && selectedSupplier && (
        <SupplierDetail
          supplier={selectedSupplier}
          tasks={tasks.filter(t => t.supplier_id === selectedSupplier.id)}
          onClose={() => {
            setShowSupplierDetail(false);
            setSelectedSupplier(undefined);
            loadSuppliers();
          }}
          onAddOrder={() => {
            setEditingOrder(undefined);
            setShowOrderModal(true);
          }}
          onEditOrder={(order) => {
            setEditingOrder(order);
            setShowOrderModal(true);
          }}
          onDeleteOrder={handleDeleteOrder}
          onAddContact={() => {
            setEditingSupplierContact(undefined);
            setShowSupplierContactModal(true);
          }}
          onEditContact={(contact) => {
            setEditingSupplierContact(contact);
            setShowSupplierContactModal(true);
          }}
          onDeleteContact={handleDeleteSupplierContact}
          onAddTask={() => handleAddTaskForSupplier(selectedSupplier.id)}
          onToggleTaskComplete={handleToggleTaskComplete}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {showOrderModal && selectedSupplier && (
        <OrderModal
          order={editingOrder}
          supplierName={selectedSupplier.company_name}
          defaultCurrency={selectedSupplier.currency || 'USD'}
          onClose={() => {
            setShowOrderModal(false);
            setEditingOrder(undefined);
          }}
          onSave={handleSaveOrder}
        />
      )}

      {showSupplierContactModal && selectedSupplier && (
        <SupplierContactModal
          contact={editingSupplierContact}
          supplierName={selectedSupplier.company_name}
          onClose={() => {
            setShowSupplierContactModal(false);
            setEditingSupplierContact(undefined);
          }}
          onSave={handleSaveSupplierContact}
        />
      )}

      {showSupplierImportModal && (
        <SupplierImportModal
          onClose={() => setShowSupplierImportModal(false)}
          onImport={handleImportSuppliers}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          contacts={contacts}
          suppliers={suppliers}
          preselectedContactId={preselectedContactId}
          preselectedSupplierId={preselectedSupplierId}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(undefined);
            setPreselectedContactId(undefined);
            setPreselectedSupplierId(undefined);
          }}
          onSave={handleSaveTask}
        />
      )}

      {showCommunicationsHistory && (
        <CommunicationsHistory
          calls={allCalls}
          emails={allEmails}
          deals={allDeals}
          contacts={contacts}
          completedGoals={completedGoals}
          onClose={() => setShowCommunicationsHistory(false)}
        />
      )}

      {showButtonOrderSettings && (
        <ButtonOrderSettings
          currentOrder={buttonOrder}
          onClose={() => setShowButtonOrderSettings(false)}
          onSave={handleSaveButtonOrder}
        />
      )}

      {showDuplicatesModal && (
        <DuplicatesModal
          contacts={contacts}
          onClose={() => {
            setShowDuplicatesModal(false);
            loadContacts();
          }}
          onDelete={handleDeleteContact}
        />
      )}

      {showAccountSettings && (
        <AccountSettings
          onClose={() => setShowAccountSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
