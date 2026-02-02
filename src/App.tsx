import { useEffect, useState } from 'react';
import { Plus, Search, Users, Upload, Settings, Filter, Package, Trash2, LayoutGrid, Table, CheckSquare, History, ArrowUpDown, Download, Copy, LogOut, UserCog, Target, StickyNote, TrendingUp, Layers, X, Bell, ChevronDown, FolderOpen, PieChart, Calendar, Map as MapIcon, BarChart3 } from 'lucide-react';
import { useAuth } from './lib/auth';
import { Workspace, getWorkspaces, getOrCreateDefaultWorkspace } from './lib/workspaces';
import AuthForm from './components/AuthForm';
import { supabase, ContactWithActivity, ContactPerson, Vessel, FuelDeal, Call, Email, SupplierWithOrders, Supplier, SupplierOrder, SupplierContact, SupplierPort, Task, TaskWithRelated, Contact, DailyGoal, CallSchedule } from './lib/supabase';
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
import PriorityLabelSettings from './components/PriorityLabelSettings';
import VesselModal from './components/VesselModal';
import FuelDealModal from './components/FuelDealModal';
import SupplierList from './components/SupplierList';
import SupplierTableView from './components/SupplierTableView';
import SupplierMapView from './components/SupplierMapView';
import SupplierModal from './components/SupplierModal';
import SupplierDetail from './components/SupplierDetail';
import OrderModal from './components/OrderModal';
import SupplierContactModal from './components/SupplierContactModal';
import SupplierPortModal from './components/SupplierPortModal';
import SupplierPortDuplicatesModal from './components/SupplierPortDuplicatesModal';
import TaskModal from './components/TaskModal';
import TaskList from './components/TaskList';
import CalendarView from './components/CalendarView';
import CommunicationsHistory from './components/CommunicationsHistory';
import ButtonOrderSettings from './components/ButtonOrderSettings';
import PanelOrderSettings from './components/PanelOrderSettings';
import MultiSelectDropdown from './components/MultiSelectDropdown';
import AccountSettings from './components/AccountSettings';
import DuplicatesModal from './components/DuplicatesModal';
import SupplierImportModal from './components/SupplierImportModal';
import DailyGoals from './components/DailyGoals';
import GlobalGoalNotifications from './components/GlobalGoalNotifications';
import GoalProgressBox from './components/GoalProgressBox';
import BulkSearchModal from './components/BulkSearchModal';
import Notepad from './components/Notepad';
import NotesSection from './components/NotesSection';
import NoteModal from './components/NoteModal';
import PriorityList from './components/PriorityList';
import PriorityPanel from './components/PriorityPanel';
import NotificationSettingsModal from './components/NotificationSettingsModal';
import WorkspaceModal from './components/WorkspaceModal';
import StatsModal from './components/StatsModal';
import DayScheduleModal from './components/DayScheduleModal';
import MGOPricesModal from './components/MGOPricesModal';

interface NotificationSettings {
  id?: string;
  user_email: string;
  days_before_reminder: number;
  enabled: boolean;
}

interface SavedNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  contact_id?: string;
  created_at: string;
  updated_at: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'contacts' | 'suppliers' | 'tasks' | 'notes' | 'priority' | 'calendar'>('contacts');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');
  const [contacts, setContacts] = useState<ContactWithActivity[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactWithActivity[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierWithOrders[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierWithOrders[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierSearch, setSelectedSupplierSearch] = useState('');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
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
  const [showSupplierPortModal, setShowSupplierPortModal] = useState(false);
  const [showSupplierPortDuplicatesModal, setShowSupplierPortDuplicatesModal] = useState(false);
  const [showSupplierImportModal, setShowSupplierImportModal] = useState(false);
  const [showBulkSearchModal, setShowBulkSearchModal] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | undefined>();
  const [editingFuelDeal, setEditingFuelDeal] = useState<FuelDeal | undefined>();
  const [editingCall, setEditingCall] = useState<Call | undefined>();
  const [editingEmail, setEditingEmail] = useState<Email | undefined>();
  const [scheduleData, setScheduleData] = useState<Partial<CallSchedule> | undefined>();
  const [editingContact, setEditingContact] = useState<ContactWithActivity | undefined>();
  const [selectedContact, setSelectedContact] = useState<ContactWithActivity | undefined>();
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithOrders | undefined>();
  const [editingOrder, setEditingOrder] = useState<SupplierOrder | undefined>();
  const [editingSupplierContact, setEditingSupplierContact] = useState<SupplierContact | undefined>();
  const [editingSupplierPort, setEditingSupplierPort] = useState<SupplierPort | undefined>();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | undefined>();
  const [filterCountries, setFilterCountries] = useState<string[]>([]);
  const [filterTimezones, setFilterTimezones] = useState<string[]>([]);
  const [filterNames, setFilterNames] = useState<string[]>([]);
  const [filterCompanies, setFilterCompanies] = useState<string[]>([]);
  const [filterCompanySizes, setFilterCompanySizes] = useState<string[]>([]);
  const [filterEmails, setFilterEmails] = useState<string[]>([]);
  const [filterPhones, setFilterPhones] = useState<string[]>([]);
  const [filterPhoneTypes, setFilterPhoneTypes] = useState<string[]>([]);
  const [filterEmailTypes, setFilterEmailTypes] = useState<string[]>([]);
  const [filterCities, setFilterCities] = useState<string[]>([]);
  const [filterPostCodes, setFilterPostCodes] = useState<string[]>([]);
  const [filterWebsites, setFilterWebsites] = useState<string[]>([]);
  const [filterAddresses, setFilterAddresses] = useState<string[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<string[]>([]);
  const [visibleFilters, setVisibleFilters] = useState<{
    name: boolean;
    company: boolean;
    companySize: boolean;
    email: boolean;
    emailType: boolean;
    phone: boolean;
    phoneType: boolean;
    city: boolean;
    postCode: boolean;
    website: boolean;
    address: boolean;
    country: boolean;
    timezone: boolean;
    priority: boolean;
  }>({
    name: true,
    company: true,
    companySize: true,
    email: true,
    emailType: true,
    phone: true,
    phoneType: true,
    city: true,
    postCode: true,
    website: true,
    address: true,
    country: true,
    timezone: true,
    priority: true,
  });
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [activityDateFilter, setActivityDateFilter] = useState<string>('all');
  const [jammedReasonFilter, setJammedReasonFilter] = useState<string>('');
  const [tractionReasonFilter, setTractionReasonFilter] = useState<string>('');
  const [clientReasonFilter, setClientReasonFilter] = useState<string>('');
  const [deadReasonFilter, setDeadReasonFilter] = useState<string>('');
  const [statusFilters, setStatusFilters] = useState<{
    hasTraction: boolean;
    isClient: boolean;
    isJammed: boolean;
    isDead: boolean;
    none: boolean;
  }>({
    hasTraction: false,
    isClient: false,
    isJammed: false,
    isDead: false,
    none: false,
  });
  const [filterPort, setFilterPort] = useState<string>('all');
  const [filterFuelType, setFilterFuelType] = useState<string>('all');
  const [filterDeliveryMethod, setFilterDeliveryMethod] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterBusinessClassification, setFilterBusinessClassification] = useState<string>('Supplier');
  const [supplierSortBy, setSupplierSortBy] = useState<'name' | 'type' | 'classification' | 'country' | 'region'>('name');
  const [tasks, setTasks] = useState<TaskWithRelated[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithRelated[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDayScheduleModal, setShowDayScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SavedNote | undefined>();
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
  const [showPanelOrderSettings, setShowPanelOrderSettings] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [showGoalProgressBox, setShowGoalProgressBox] = useState(() => {
    const saved = localStorage.getItem('goalProgressBoxVisible');
    return saved !== null ? saved === 'true' : true;
  });
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showNotepad, setShowNotepad] = useState(false);
  const [showPriorityPanel, setShowPriorityPanel] = useState(false);
  const [showMGOPrices, setShowMGOPrices] = useState(false);
  const [showPriorityLabelSettings, setShowPriorityLabelSettings] = useState(false);
  const [notepadExpanded, setNotepadExpanded] = useState(true);
  const [goalsExpanded, setGoalsExpanded] = useState(true);
  const [priorityExpanded, setPriorityExpanded] = useState(true);
  const [hasGoals, setHasGoals] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteId, setNoteId] = useState<string | undefined>();
  const [buttonOrder, setButtonOrder] = useState<string[]>(['copy-emails', 'export', 'history', 'duplicates', 'delete-all', 'settings', 'import', 'bulk-search', 'add-contact', 'alerts', 'stats']);
  const [panelOrder, setPanelOrder] = useState<string[]>(['notes', 'goals', 'priority', 'mgo']);
  const [panelSpacing, setPanelSpacing] = useState<number>(2);
  const [oilPricesOrder, setOilPricesOrder] = useState<string[]>(['WTI', 'Brent', 'MGO', 'VLSFO', 'IFO 380']);
  const [visibleOilPrices, setVisibleOilPrices] = useState<string[]>(['WTI', 'Brent', 'MGO', 'VLSFO', 'IFO 380']);
  const [customPriorityLabels, setCustomPriorityLabels] = useState<Record<number, string>>({
    0: 'Client',
    1: 'Highest',
    2: 'High',
    3: 'Medium',
    4: 'Low',
    5: 'Lowest'
  });
  const { user, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;
    loadWorkspaces();
    loadNotificationSettings();
    loadTasks();
    loadButtonOrder();
    loadNotes();
    loadSavedNotes();
  }, [user]);

  useEffect(() => {
    if (!user || !currentWorkspace) return;
    loadContacts();
    loadSuppliers();
    loadTasks();
    loadSavedNotes();
  }, [user, currentWorkspace]);

  useEffect(() => {
    if (selectedContact) {
      const updated = contacts.find(c => c.id === selectedContact.id);
      if (updated) {
        setSelectedContact(updated);
      }
    }
  }, [contacts]);

  useEffect(() => {
    let filtered = [...contacts];

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();

      // Check if searching for "none" variations
      const isNoneSearch = ['none', 'no ', 'empty', 'blank', 'null', 'missing'].some(keyword => query.includes(keyword));

      filtered = filtered.filter(
        (contact) => {
          const priorityMatch = contact.priority_rank !== null && contact.priority_rank !== undefined && (
            contact.priority_rank.toString().includes(query) ||
            customPriorityLabels[contact.priority_rank]?.toLowerCase().includes(query)
          );

          // Check for "none" searches across all fields
          if (isNoneSearch) {
            return (!contact.name?.trim() && query.includes('name')) ||
                   (!contact.company?.trim() && query.includes('company')) ||
                   (!contact.email?.trim() && query.includes('email')) ||
                   (!contact.phone?.trim() && query.includes('phone')) ||
                   (!contact.city?.trim() && query.includes('city')) ||
                   (!contact.post_code?.trim() && (query.includes('post') || query.includes('code'))) ||
                   (!contact.website?.trim() && query.includes('website')) ||
                   (!contact.address?.trim() && query.includes('address')) ||
                   (!contact.country?.trim() && query.includes('country')) ||
                   (!contact.timezone?.trim() && query.includes('timezone')) ||
                   ((contact.priority_rank === null || contact.priority_rank === undefined) && query.includes('priority'));
          }

          return contact.name.toLowerCase().includes(query) ||
            contact.company?.toLowerCase().includes(query) ||
            contact.email?.toLowerCase().includes(query) ||
            contact.phone?.toLowerCase().includes(query) ||
            contact.city?.toLowerCase().includes(query) ||
            contact.post_code?.toLowerCase().includes(query) ||
            contact.website?.toLowerCase().includes(query) ||
            contact.address?.toLowerCase().includes(query) ||
            contact.country?.toLowerCase().includes(query) ||
            contact.timezone?.toLowerCase().includes(query) ||
            contact.jammed_note?.toLowerCase().includes(query) ||
            contact.traction_note?.toLowerCase().includes(query) ||
            contact.client_note?.toLowerCase().includes(query) ||
            contact.dead_note?.toLowerCase().includes(query) ||
            priorityMatch;
        }
      );
    }

    // Apply name filter
    if (filterNames.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterNames.includes('[None]') && !contact.name?.trim()) return true;
        return filterNames.includes(contact.name);
      });
    }

    // Apply company filter
    if (filterCompanies.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterCompanies.includes('[None]') && !contact.company?.trim()) return true;
        return contact.company && filterCompanies.includes(contact.company);
      });
    }

    // Apply company size filter
    if (filterCompanySizes.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterCompanySizes.includes('[None]') && !contact.company_size?.trim()) return true;
        return contact.company_size && filterCompanySizes.includes(contact.company_size);
      });
    }

    // Apply email filter
    if (filterEmails.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterEmails.includes('[None]') && !contact.email?.trim()) return true;
        return contact.email && filterEmails.includes(contact.email);
      });
    }

    // Apply phone filter
    if (filterPhones.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterPhones.includes('[None]') && !contact.phone?.trim()) return true;
        return contact.phone && filterPhones.includes(contact.phone);
      });
    }

    // Apply phone type filter
    if (filterPhoneTypes.length > 0) {
      filtered = filtered.filter((contact) => {
        const hasNoneFilter = filterPhoneTypes.includes('[None]');
        const contactPhoneType = contact.phone_type?.toLowerCase();

        if (hasNoneFilter && !contactPhoneType && !contact.contact_persons.some(cp => cp.phone_type || cp.mobile_type)) {
          return true;
        }

        if (contactPhoneType && filterPhoneTypes.some(ft => ft.toLowerCase() === contactPhoneType)) {
          return true;
        }

        return contact.contact_persons.some(cp => {
          const cpPhoneType = cp.phone_type?.toLowerCase();
          const cpMobileType = cp.mobile_type?.toLowerCase();
          return (cpPhoneType && filterPhoneTypes.some(ft => ft.toLowerCase() === cpPhoneType)) ||
                 (cpMobileType && filterPhoneTypes.some(ft => ft.toLowerCase() === cpMobileType));
        });
      });
    }

    // Apply email type filter
    if (filterEmailTypes.length > 0) {
      filtered = filtered.filter((contact) => {
        const hasNoneFilter = filterEmailTypes.includes('[None]');
        const contactEmailType = contact.email_type?.toLowerCase();

        if (hasNoneFilter && !contactEmailType && !contact.contact_persons.some(cp => cp.email_type)) {
          return true;
        }

        if (contactEmailType && filterEmailTypes.some(ft => ft.toLowerCase() === contactEmailType)) {
          return true;
        }

        return contact.contact_persons.some(cp => {
          const cpEmailType = cp.email_type?.toLowerCase();
          return cpEmailType && filterEmailTypes.some(ft => ft.toLowerCase() === cpEmailType);
        });
      });
    }

    // Apply city filter
    if (filterCities.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterCities.includes('[None]') && !contact.city?.trim()) return true;
        return contact.city && filterCities.includes(contact.city);
      });
    }

    // Apply post code filter
    if (filterPostCodes.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterPostCodes.includes('[None]') && !contact.post_code?.trim()) return true;
        return contact.post_code && filterPostCodes.includes(contact.post_code);
      });
    }

    // Apply website filter
    if (filterWebsites.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterWebsites.includes('[None]') && !contact.website?.trim()) return true;
        return contact.website && filterWebsites.includes(contact.website);
      });
    }

    // Apply address filter
    if (filterAddresses.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterAddresses.includes('[None]') && !contact.address?.trim()) return true;
        return contact.address && filterAddresses.includes(contact.address);
      });
    }

    // Apply country filter
    if (filterCountries.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterCountries.includes('[None]') && !contact.country?.trim()) return true;
        return contact.country && filterCountries.includes(contact.country);
      });
    }

    // Apply timezone filter
    if (filterTimezones.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterTimezones.includes('[None]') && !contact.timezone?.trim()) return true;
        return contact.timezone && filterTimezones.includes(contact.timezone);
      });
    }

    // Apply priority filter
    if (filterPriorities.length > 0) {
      filtered = filtered.filter((contact) => {
        if (filterPriorities.includes('[None]') && (contact.priority_rank === null || contact.priority_rank === undefined)) return true;
        if (contact.priority_rank === null || contact.priority_rank === undefined) return false;
        return filterPriorities.includes(contact.priority_rank.toString());
      });
    }

    // Apply status filters (OR logic - show contacts matching ANY selected status)
    const hasActiveStatusFilter = statusFilters.hasTraction || statusFilters.isClient || statusFilters.isJammed || statusFilters.isDead || statusFilters.none;
    if (hasActiveStatusFilter) {
      filtered = filtered.filter((contact) => {
        if (statusFilters.hasTraction && contact.has_traction) return true;
        if (statusFilters.isClient && contact.is_client) return true;
        if (statusFilters.isJammed && contact.is_jammed) return true;
        if (statusFilters.isDead && contact.is_dead) return true;
        if (statusFilters.none && !contact.has_traction && !contact.is_client && !contact.is_jammed && !contact.is_dead) return true;
        return false;
      });
    }

    // Apply jammed reason filter
    if (jammedReasonFilter.trim()) {
      const searchLower = jammedReasonFilter.toLowerCase();
      filtered = filtered.filter((contact) => {
        if (!contact.is_jammed) return false;

        // Check for "no reason" variations
        const noReasonKeywords = ['[no reason]', 'no reason', 'nothing', 'none', 'empty', 'blank'];
        if (noReasonKeywords.some(keyword => searchLower.includes(keyword))) {
          return !contact.jammed_note?.trim() && !contact.jammed_additional_note?.trim();
        }

        const jammedNote = contact.jammed_note?.toLowerCase() || '';
        const jammedAdditionalNote = contact.jammed_additional_note?.toLowerCase() || '';
        return jammedNote.includes(searchLower) || jammedAdditionalNote.includes(searchLower);
      });
    }

    // Apply traction reason filter
    if (tractionReasonFilter.trim()) {
      const searchLower = tractionReasonFilter.toLowerCase();
      filtered = filtered.filter((contact) => {
        if (!contact.has_traction) return false;

        // Check for "no reason" variations
        const noReasonKeywords = ['[no reason]', 'no reason', 'nothing', 'none', 'empty', 'blank'];
        if (noReasonKeywords.some(keyword => searchLower.includes(keyword))) {
          return !contact.traction_note?.trim();
        }

        const tractionNote = contact.traction_note?.toLowerCase() || '';
        return tractionNote.includes(searchLower);
      });
    }

    // Apply client reason filter
    if (clientReasonFilter.trim()) {
      const searchLower = clientReasonFilter.toLowerCase();
      filtered = filtered.filter((contact) => {
        if (!contact.is_client) return false;

        // Check for "no reason" variations
        const noReasonKeywords = ['[no reason]', 'no reason', 'nothing', 'none', 'empty', 'blank'];
        if (noReasonKeywords.some(keyword => searchLower.includes(keyword))) {
          return !contact.client_note?.trim();
        }

        const clientNote = contact.client_note?.toLowerCase() || '';
        return clientNote.includes(searchLower);
      });
    }

    // Apply dead reason filter
    if (deadReasonFilter.trim()) {
      const searchLower = deadReasonFilter.toLowerCase();
      filtered = filtered.filter((contact) => {
        if (!contact.is_dead) return false;

        // Check for "no reason" variations
        const noReasonKeywords = ['[no reason]', 'no reason', 'nothing', 'none', 'empty', 'blank'];
        if (noReasonKeywords.some(keyword => searchLower.includes(keyword))) {
          return !contact.dead_note?.trim() && !contact.dead_additional_note?.trim();
        }

        const deadNote = contact.dead_note?.toLowerCase() || '';
        const deadAdditionalNote = contact.dead_additional_note?.toLowerCase() || '';
        return deadNote.includes(searchLower) || deadAdditionalNote.includes(searchLower);
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
        case 'email_type':
          return (a.email_type || '').localeCompare(b.email_type || '');
        case 'priority': {
          const aPriority = a.priority_rank !== null && a.priority_rank !== undefined ? a.priority_rank : 999;
          const bPriority = b.priority_rank !== null && b.priority_rank !== undefined ? b.priority_rank : 999;
          return aPriority - bPriority;
        }
        case 'status': {
          const getStatusOrder = (contact: ContactWithActivity) => {
            if (contact.is_client) return 0;
            if (contact.has_traction) return 1;
            if (!contact.is_jammed && !contact.is_dead) return 2;
            if (contact.is_jammed) return 3;
            if (contact.is_dead) return 4;
            return 5;
          };
          return getStatusOrder(a) - getStatusOrder(b);
        }
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
  }, [searchQuery, contacts, filterCountries, filterTimezones, filterNames, filterCompanies, filterCompanySizes, filterEmails, filterPhones, filterPhoneTypes, filterEmailTypes, filterCities, filterPostCodes, filterWebsites, filterAddresses, filterPriorities, sortBy, statusFilters, activityDateFilter, jammedReasonFilter, tractionReasonFilter, clientReasonFilter, deadReasonFilter]);

  useEffect(() => {
    let filtered = [...suppliers];

    if (selectedSupplierSearch) {
      filtered = filtered.filter(
        (supplier) => supplier.id === selectedSupplierSearch
      );
    }

    if (supplierSearchQuery.trim() !== '') {
      const query = supplierSearchQuery.toLowerCase();
      filtered = filtered.filter((supplier) => {
        const companyMatch = supplier.company_name.toLowerCase().includes(query);
        const contactMatch = supplier.contact_person?.toLowerCase().includes(query);
        const emailMatch = (supplier.general_email?.toLowerCase().includes(query) || supplier.email?.toLowerCase().includes(query));
        const phoneMatch = supplier.phone?.toLowerCase().includes(query);
        const countryMatch = supplier.country?.toLowerCase().includes(query);
        const regionMatch = supplier.regions?.some(r => r.name.toLowerCase().includes(query));

        const portsMatch = supplier.ports_detailed?.some(port =>
          port.port_name.toLowerCase().includes(query)
        ) || supplier.ports?.toLowerCase().includes(query);

        const fuelTypesMatch = supplier.fuel_types?.toLowerCase().includes(query);

        return companyMatch || contactMatch || emailMatch || phoneMatch || countryMatch ||
               regionMatch || portsMatch || fuelTypesMatch;
      });
    }

    if (filterPort !== 'all') {
      filtered = filtered.filter((supplier) => {
        if (!supplier.ports_detailed || supplier.ports_detailed.length === 0) {
          if (!supplier.ports) return false;
          const ports = supplier.ports.split(';').map(p => p.trim().toLowerCase());
          return ports.some(port => port.includes(filterPort.toLowerCase()));
        }
        return supplier.ports_detailed.some(port =>
          port.port_name.toLowerCase().includes(filterPort.toLowerCase())
        );
      });
    }

    if (filterDeliveryMethod !== 'all') {
      filtered = filtered.filter((supplier) => {
        if (!supplier.ports_detailed || supplier.ports_detailed.length === 0) return false;
        return supplier.ports_detailed.some(port => {
          if (filterDeliveryMethod === 'barge') return port.has_barge;
          if (filterDeliveryMethod === 'truck') return port.has_truck;
          if (filterDeliveryMethod === 'expipe') return port.has_expipe;
          return false;
        });
      });
    }

    if (filterFuelType !== 'all') {
      filtered = filtered.filter((supplier) => {
        if (!supplier.fuel_types) return false;
        const fuelTypes = supplier.fuel_types.split(';').map(f => f.trim().toLowerCase());
        return fuelTypes.some(fuel => fuel.includes(filterFuelType.toLowerCase()));
      });
    }

    if (filterRegion !== 'all') {
      filtered = filtered.filter((supplier) => {
        if (!supplier.regions || supplier.regions.length === 0) return false;
        return supplier.regions.some(region => region.name === filterRegion);
      });
    }

    if (filterBusinessClassification !== 'all') {
      filtered = filtered.filter((supplier) => {
        return supplier.business_classification === filterBusinessClassification;
      });
    }

    filtered.sort((a, b) => {
      switch (supplierSortBy) {
        case 'name':
          return a.company_name.localeCompare(b.company_name);
        case 'type':
          return (a.supplier_type || '').localeCompare(b.supplier_type || '');
        case 'classification':
          return (a.business_classification || '').localeCompare(b.business_classification || '');
        case 'country':
          return (a.country || '').localeCompare(b.country || '');
        case 'region': {
          const aRegion = a.regions?.[0]?.name || '';
          const bRegion = b.regions?.[0]?.name || '';
          return aRegion.localeCompare(bRegion);
        }
        default:
          return a.company_name.localeCompare(b.company_name);
      }
    });

    setFilteredSuppliers(filtered);
  }, [suppliers, selectedSupplierSearch, supplierSearchQuery, filterPort, filterFuelType, filterDeliveryMethod, filterRegion, filterBusinessClassification, supplierSortBy]);

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

  const loadWorkspaces = async () => {
    if (!user) return;
    try {
      const workspacesData = await getWorkspaces(user.id);
      if (workspacesData.length === 0) {
        const defaultWorkspace = await getOrCreateDefaultWorkspace(user.id);
        setWorkspaces([defaultWorkspace]);
        setCurrentWorkspace(defaultWorkspace);
      } else {
        setWorkspaces(workspacesData);
        const defaultWs = workspacesData.find(w => w.is_default) || workspacesData[0];
        setCurrentWorkspace(defaultWs);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  };

  const loadContacts = async () => {
    if (!currentWorkspace) return;
    try {
      let query = supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (currentWorkspace) {
        query = query.or(`workspace_id.eq.${currentWorkspace.id},workspace_id.is.null`);
      }

      const { data: contactsData, error: contactsError } = await query;

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
          priority_rank: contactData.priority_rank,
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
          workspace_id: currentWorkspace?.id,
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

  const handleUpdateContactStatus = async (contactId: string, statusField: 'is_jammed' | 'has_traction' | 'is_client' | 'is_dead', value: boolean) => {
    try {
      const updateData: any = { [statusField]: value };
      const dateField = statusField === 'is_jammed' ? 'jammed_date'
        : statusField === 'has_traction' ? 'traction_date'
        : statusField === 'is_client' ? 'client_date'
        : 'dead_date';

      if (value) {
        updateData[dateField] = new Date().toISOString();
      } else {
        updateData[dateField] = null;
      }

      const updatedContacts = contacts.map(c =>
        c.id === contactId ? { ...c, ...updateData } : c
      );
      setContacts(updatedContacts);

      if (selectedContact?.id === contactId) {
        setSelectedContact({ ...selectedContact, ...updateData });
      }

      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating contact status:', error);
      await loadContacts();
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

  const handleSaveCall = async (callData: { id?: string; call_date: string; duration?: number; spoke_with?: string; phone_number?: string; notes?: string; communication_type?: string }, newPIC?: { name: string; phone?: string; email?: string }, task?: { task_type: string; title: string; due_date?: string; notes: string; contact_id?: string; supplier_id?: string }, callType?: 'regular' | 'no_answer' | 'call_later_today') => {
    if (!selectedContact) return;

    try {
      if (newPIC) {
        const picData: any = {
          user_id: user.id,
          contact_id: selectedContact.id,
          name: newPIC.name,
        };
        if (newPIC.phone) picData.phone = newPIC.phone;
        if (newPIC.email) picData.email = newPIC.email;

        const { error: picError } = await supabase
          .from('contact_persons')
          .insert([picData]);

        if (picError) throw picError;
      }

      if (callData.communication_type === 'email') {
        const emailData = {
          email_date: callData.call_date,
          emailed_to: callData.spoke_with,
          email_address: callData.phone_number,
          notes: callData.notes,
        };

        if (callData.id) {
          const { id, ...updateData } = emailData;
          const { error } = await supabase
            .from('emails')
            .update(updateData)
            .eq('id', callData.id);

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
      } else {
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
      }

      if (task) {
        const taskInsert: any = {
          user_id: user.id,
          task_type: task.task_type,
          title: task.title,
          notes: task.notes || null,
          completed: false,
        };

        if (task.due_date) {
          taskInsert.due_date = task.due_date;
        }

        if (task.contact_id) {
          taskInsert.contact_id = task.contact_id;
        } else if (task.supplier_id) {
          taskInsert.supplier_id = task.supplier_id;
        } else {
          taskInsert.contact_id = selectedContact.id;
        }

        const { error: taskError } = await supabase.from('tasks').insert([taskInsert]);

        if (taskError) {
          console.error('Error creating task:', taskError);
          throw taskError;
        }
        await loadTasks();
      }

      const contactUpdates: any = {};

      if (callData.communication_type === 'email') {
        const { data: allEmails } = await supabase
          .from('emails')
          .select('email_date')
          .eq('contact_id', selectedContact.id)
          .order('email_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (allEmails) {
          contactUpdates.last_emailed = allEmails.email_date;
        }
      } else {
        const { data: allCalls } = await supabase
          .from('calls')
          .select('call_date')
          .eq('contact_id', selectedContact.id)
          .order('call_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (allCalls) {
          contactUpdates.last_called = allCalls.call_date;
        }
      }

      if (callType && !callData.id) {
        const callDateTime = new Date(callData.call_date);
        let followUpDate: Date;

        switch (callType) {
          case 'no_answer':
            followUpDate = new Date(callDateTime);
            followUpDate.setDate(followUpDate.getDate() + 1);
            break;
          case 'call_later_today':
            followUpDate = new Date(callDateTime);
            break;
          case 'regular':
          default:
            followUpDate = new Date(callDateTime);
            followUpDate.setDate(followUpDate.getDate() + 7);
            break;
        }

        contactUpdates.follow_up_date = followUpDate.toISOString();
      }

      if (Object.keys(contactUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update(contactUpdates)
          .eq('id', selectedContact.id);

        if (updateError) throw updateError;
      }

      await loadContacts();

      const updatedContact = contacts.find(c => c.id === selectedContact.id);
      if (updatedContact) {
        setSelectedContact(updatedContact);
      }
      setEditingCall(undefined);

      if (!callData.id) {
        const today = new Date().toISOString().split('T')[0];
        const goalType = callData.communication_type === 'email' ? 'emails' : 'calls';
        const { data: activeGoal } = await supabase
          .from('daily_goals')
          .select('id, manual_count')
          .eq('user_id', user.id)
          .eq('goal_type', goalType)
          .eq('target_date', today)
          .eq('is_active', true)
          .maybeSingle();

        if (activeGoal) {
          await supabase
            .from('daily_goals')
            .update({ manual_count: (activeGoal.manual_count || 0) + 1 })
            .eq('id', activeGoal.id);
        }
      }
    } catch (error) {
      console.error('Error saving call:', error);
    }
  };

  const handleSaveEmail = async (emailData: { id?: string; email_date: string; subject?: string; emailed_to?: string; email_address?: string; notes?: string }, newPIC?: { name: string; email: string }, task?: { task_type: string; title: string; due_date?: string; notes: string; contact_id?: string; supplier_id?: string }) => {
    if (!selectedContact) return;

    try {
      if (newPIC) {
        const { error: picError } = await supabase
          .from('contact_persons')
          .insert([{
            user_id: user.id,
            contact_id: selectedContact.id,
            name: newPIC.name,
            email: newPIC.email,
          }]);

        if (picError) throw picError;
      }

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

      if (task) {
        const taskInsert: any = {
          user_id: user.id,
          task_type: task.task_type,
          title: task.title,
          notes: task.notes || null,
          completed: false,
        };

        if (task.due_date) {
          taskInsert.due_date = task.due_date;
        }

        if (task.contact_id) {
          taskInsert.contact_id = task.contact_id;
        } else if (task.supplier_id) {
          taskInsert.supplier_id = task.supplier_id;
        } else {
          taskInsert.contact_id = selectedContact.id;
        }

        const { error: taskError } = await supabase.from('tasks').insert([taskInsert]);

        if (taskError) {
          console.error('Error creating task:', taskError);
          throw taskError;
        }
        await loadTasks();
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
      setEditingEmail(undefined);
    } catch (error) {
      console.error('Error saving email:', error);
    }
  };

  const loadSuppliers = async () => {
    if (!currentWorkspace) return;
    try {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('company_name');

      if (currentWorkspace) {
        query = query.or(`workspace_id.eq.${currentWorkspace.id},workspace_id.is.null`);
      }

      const { data: suppliersData, error: suppliersError } = await query;

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

      const { data: portsData, error: portsError } = await supabase
        .from('supplier_ports')
        .select('*')
        .order('port_name');

      if (portsError) throw portsError;

      const { data: portFuelTypesData, error: portFuelTypesError } = await supabase
        .from('supplier_port_fuel_types')
        .select(`
          port_id,
          fuel_type:custom_fuel_types(id, name, user_id, created_at)
        `);

      if (portFuelTypesError) throw portFuelTypesError;

      const { data: portDeliveryMethodsData, error: portDeliveryMethodsError } = await supabase
        .from('supplier_port_delivery_methods')
        .select(`
          port_id,
          delivery_method:custom_delivery_methods(id, name, user_id, created_at)
        `);

      if (portDeliveryMethodsError) throw portDeliveryMethodsError;

      const { data: supplierRegionsData, error: supplierRegionsError } = await supabase
        .from('supplier_regions')
        .select(`
          supplier_id,
          region:uk_regions(id, name, created_at)
        `);

      if (supplierRegionsError) throw supplierRegionsError;

      const { data: portRegionsData, error: portRegionsError } = await supabase
        .from('uk_port_regions')
        .select(`
          port_name,
          region:uk_regions(name)
        `);

      if (portRegionsError) throw portRegionsError;

      const suppliersWithOrders: SupplierWithOrders[] = (suppliersData || []).map((supplier) => {
        const supplierOrders = (ordersData || []).filter((order) => order.supplier_id === supplier.id);
        const supplierContacts = (contactsData || []).filter((contact) => contact.supplier_id === supplier.id);
        const supplierPorts = (portsData || []).filter((port) => port.supplier_id === supplier.id).map((port) => {
          const portRegionData = (portRegionsData || []).find((pr: any) =>
            pr.port_name.toLowerCase() === port.port_name.toLowerCase()
          );
          return {
            ...port,
            region: portRegionData?.region?.name,
            custom_fuel_types: (portFuelTypesData || [])
              .filter((pft: any) => pft.port_id === port.id)
              .map((pft: any) => pft.fuel_type)
              .filter(Boolean),
            custom_delivery_methods: (portDeliveryMethodsData || [])
              .filter((pdm: any) => pdm.port_id === port.id)
              .map((pdm: any) => pdm.delivery_method)
              .filter(Boolean),
          };
        });
        const supplierRegions = (supplierRegionsData || [])
          .filter((sr: any) => sr.supplier_id === supplier.id)
          .map((sr: any) => sr.region)
          .filter(Boolean);

        return {
          ...supplier,
          orders: supplierOrders,
          contacts: supplierContacts,
          ports_detailed: supplierPorts,
          regions: supplierRegions,
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

  const handleUpdateContact = async (contact: ContactWithActivity) => {
    try {
      const updatedContacts = contacts.map(c =>
        c.id === contact.id ? contact : c
      );
      setContacts(updatedContacts);
      setSelectedContact(contact);

      const { error } = await supabase
        .from('contacts')
        .update({
          traction_note: contact.traction_note,
          client_note: contact.client_note,
          jammed_note: contact.jammed_note,
          dead_note: contact.dead_note,
          jammed_additional_note: contact.jammed_additional_note,
          traction_additional_note: contact.traction_additional_note,
          client_additional_note: contact.client_additional_note,
          dead_additional_note: contact.dead_additional_note,
          priority_rank: contact.priority_rank,
          follow_up_date: contact.follow_up_date,
          follow_up_reason: contact.follow_up_reason,
        })
        .eq('id', contact.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating contact:', error);
      await loadContacts();
    }
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

  const loadNotes = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setNoteContent(data.content || '');
        setNoteId(data.id);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleSaveNote = async (content: string) => {
    if (!user) return;
    try {
      if (noteId) {
        const { error } = await supabase
          .from('notes')
          .update({
            content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', noteId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert([{ user_id: user.id, content }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setNoteId(data.id);
        }
      }

      setNoteContent(content);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const loadSavedNotes = async () => {
    if (!user || !currentWorkspace?.id) return;
    try {
      const { data, error } = await supabase
        .from('saved_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('workspace_id', currentWorkspace.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading saved notes:', error);
        throw error;
      }

      console.log('Loaded saved notes:', data?.length || 0);
      setSavedNotes(data || []);
    } catch (error) {
      console.error('Error loading saved notes:', error);
    }
  };

  const handleSaveSavedNote = async (note: Partial<SavedNote>) => {
    if (!user) return;
    try {
      if (note.id) {
        const { error } = await supabase
          .from('saved_notes')
          .update({
            title: note.title,
            content: note.content,
            contact_id: note.contact_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', note.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_notes')
          .insert([{
            user_id: user.id,
            workspace_id: currentWorkspace?.id,
            title: note.title,
            content: note.content,
            contact_id: note.contact_id,
          }]);

        if (error) throw error;
      }

      await loadSavedNotes();
      setShowNoteModal(false);
      setEditingNote(undefined);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDeleteSavedNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('saved_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      await loadSavedNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleAddNote = () => {
    setEditingNote(undefined);
    setShowNoteModal(true);
  };

  const handleEditSavedNote = (note: SavedNote) => {
    setEditingNote(note);
    setShowNoteModal(true);
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

    const tasksData = tasks.map(task => {
      let contactStatus = 'None';
      if (task.contact) {
        if (task.contact.is_client) contactStatus = 'Client';
        else if (task.contact.has_traction) contactStatus = 'Traction';
        else if (task.contact.is_jammed) contactStatus = 'Jammed';
      }

      return {
        'Title': task.title,
        'Contact Name': task.contact?.name || '',
        'Contact Status': task.contact ? contactStatus : '',
        'Supplier Name': task.supplier?.company_name || '',
        'Due Date': task.due_date ? new Date(task.due_date).toLocaleString() : '',
        'Completed': task.completed ? 'Yes' : 'No',
        'Completed At': task.completed_at ? new Date(task.completed_at).toLocaleString() : '',
        'Is Overdue': task.is_overdue ? 'Yes' : 'No',
        'Days Until Due': task.days_until_due || '',
        'Notes': task.notes || '',
        'Created At': new Date(task.created_at).toLocaleString(),
      };
    });

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

  const searchVesselIMO = async (vesselName: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-vessel-imo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vesselName }),
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.imo || null;
    } catch (error) {
      console.error('Error searching for IMO:', error);
      return null;
    }
  };

  const handleSaveVessel = async (vesselData: Partial<Vessel> | Partial<Vessel>[]) => {
    if (!selectedContact) return;

    try {
      if (Array.isArray(vesselData)) {
        const vesselsWithIMO = await Promise.all(
          vesselData.map(async (vessel) => {
            if (!vessel.imo_number && vessel.vessel_name) {
              const imo = await searchVesselIMO(vessel.vessel_name);
              if (imo) {
                return {
                  ...vessel,
                  imo_number: imo,
                  marine_traffic_url: `https://www.marinetraffic.com/en/ais/details/ships/imo:${imo}`,
                };
              }
            }
            return vessel;
          })
        );

        const vesselsToInsert = vesselsWithIMO.map(vessel => ({
          user_id: user.id,
          contact_id: selectedContact.id,
          ...vessel,
        }));

        const { error } = await supabase.from('vessels').insert(vesselsToInsert);
        if (error) throw error;
      } else {
        if (vesselData.id) {
          const { error } = await supabase
            .from('vessels')
            .update(vesselData)
            .eq('id', vesselData.id);

          if (error) throw error;
        } else {
          let vesselToInsert = vesselData;
          if (!vesselData.imo_number && vesselData.vessel_name) {
            const imo = await searchVesselIMO(vesselData.vessel_name);
            if (imo) {
              vesselToInsert = {
                ...vesselData,
                imo_number: imo,
                marine_traffic_url: vesselData.marine_traffic_url || `https://www.marinetraffic.com/en/ais/details/ships/imo:${imo}`,
              };
            }
          }

          const { error } = await supabase.from('vessels').insert([
            {
              user_id: user.id,
              contact_id: selectedContact.id,
              ...vesselToInsert,
            },
          ]);

          if (error) throw error;
        }
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

  const handleDeleteCall = async (callId: string) => {
    try {
      const { error } = await supabase.from('calls').delete().eq('id', callId);

      if (error) throw error;
      await loadContacts();

      if (selectedContact) {
        const updatedContact = contacts.find(c => c.id === selectedContact.id);
        if (updatedContact) {
          setSelectedContact(updatedContact);
        }
      }
    } catch (error) {
      console.error('Error deleting call:', error);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    try {
      const { error } = await supabase.from('emails').delete().eq('id', emailId);

      if (error) throw error;
      await loadContacts();

      if (selectedContact) {
        const updatedContact = contacts.find(c => c.id === selectedContact.id);
        if (updatedContact) {
          setSelectedContact(updatedContact);
        }
      }
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  const handleSaveFuelDeal = async (dealData: Partial<FuelDeal>, task?: { task_type: string; title: string; due_date?: string; notes: string; contact_id?: string; supplier_id?: string }) => {
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

      if (task) {
        const taskInsert: any = {
          user_id: user.id,
          task_type: task.task_type,
          title: task.title,
          notes: task.notes || null,
          completed: false,
        };

        if (task.due_date) {
          taskInsert.due_date = task.due_date;
        }

        if (task.contact_id) {
          taskInsert.contact_id = task.contact_id;
        } else if (task.supplier_id) {
          taskInsert.supplier_id = task.supplier_id;
        } else {
          taskInsert.contact_id = selectedContact.id;
        }

        const { error: taskError } = await supabase.from('tasks').insert([taskInsert]);

        if (taskError) {
          console.error('Error creating task:', taskError);
          throw taskError;
        }
        await loadTasks();
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
      let supplierId: string;

      if (supplierData.id) {
        const { error } = await supabase
          .from('suppliers')
          .update({ ...supplierData, updated_at: new Date().toISOString() })
          .eq('id', supplierData.id);

        if (error) throw error;
        supplierId = supplierData.id;
      } else {
        const { data, error } = await supabase.from('suppliers').insert([{
          user_id: user.id,
          workspace_id: currentWorkspace?.id,
          ...supplierData
        }]).select();

        if (error) throw error;
        supplierId = data?.[0]?.id;
      }

      if (supplierData.ports && supplierId) {
        const portNames = supplierData.ports
          .split(';')
          .map(p => p.trim())
          .filter(p => p.length > 0);

        if (portNames.length > 0) {
          const { data: existingPorts } = await supabase
            .from('supplier_ports')
            .select('port_name')
            .eq('supplier_id', supplierId);

          const existingPortNames = new Set(existingPorts?.map(p => p.port_name) || []);
          const newPorts = portNames.filter(name => !existingPortNames.has(name));

          if (newPorts.length > 0) {
            const portsToInsert = newPorts.map(portName => ({
              supplier_id: supplierId,
              port_name: portName,
              has_truck: true,
              has_lsmgo: true,
              has_barge: false,
              has_expipe: false,
              has_vlsfo: false,
            }));

            await supabase.from('supplier_ports').insert(portsToInsert);
          }
        }
      }

      await loadSuppliers();

      if (selectedSupplier && supplierData.id === selectedSupplier.id) {
        const updatedSupplier = suppliers.find(s => s.id === selectedSupplier.id);
        if (updatedSupplier) {
          setSelectedSupplier(updatedSupplier);
        }
      }

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

  const handleConvertSupplierToContact = async () => {
    if (!selectedSupplier || !user) return;

    try {
      const contactData: Partial<Contact> = {
        name: selectedSupplier.contact_person || selectedSupplier.company_name,
        company: selectedSupplier.company_name,
        email: selectedSupplier.email || undefined,
        phone: selectedSupplier.phone || undefined,
        website: selectedSupplier.website || undefined,
        country: selectedSupplier.country || undefined,
        notes: selectedSupplier.notes || undefined,
      };

      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert([{
          user_id: user.id,
          workspace_id: currentWorkspace?.id,
          ...contactData
        }])
        .select()
        .single();

      if (error) throw error;

      const contactWithActivity: ContactWithActivity = {
        ...newContact,
        calls: [],
        emails: [],
        contact_persons: [],
        vessels: [],
        fuel_deals: [],
        tasks: [],
        total_calls: 0,
        total_emails: 0,
        total_deals: 0,
        total_tasks: 0,
        pending_tasks: 0,
      };

      setShowSupplierDetail(false);
      setSelectedSupplier(undefined);
      setCurrentPage('contacts');

      await loadContacts();

      setSelectedContact(contactWithActivity);
      setShowContactDetail(true);
    } catch (error) {
      console.error('Error converting supplier to contact:', error);
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

  const handleSaveSupplierPort = async (portData: Partial<SupplierPort>) => {
    if (!selectedSupplier) return;

    try {
      if (portData.id) {
        const { error } = await supabase
          .from('supplier_ports')
          .update(portData)
          .eq('id', portData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('supplier_ports').insert([
          {
            supplier_id: selectedSupplier.id,
            ...portData,
          },
        ]);

        if (error) throw error;
      }

      await loadSuppliers();
      const updatedSupplier = suppliers.find(s => s.id === selectedSupplier.id);
      if (updatedSupplier) {
        setSelectedSupplier(updatedSupplier);
      }
      setEditingSupplierPort(undefined);
    } catch (error) {
      console.error('Error saving supplier port:', error);
    }
  };

  const handleDeleteSupplierPort = async (portId: string) => {
    try {
      const { error } = await supabase.from('supplier_ports').delete().eq('id', portId);

      if (error) throw error;
      await loadSuppliers();

      if (selectedSupplier) {
        const updatedSupplier = suppliers.find(s => s.id === selectedSupplier.id);
        if (updatedSupplier) {
          setSelectedSupplier(updatedSupplier);
        }
      }
    } catch (error) {
      console.error('Error deleting supplier port:', error);
    }
  };

  const handleDeleteMultipleSupplierPorts = async (portIds: string[]) => {
    try {
      const { error } = await supabase.from('supplier_ports').delete().in('id', portIds);

      if (error) throw error;
      await loadSuppliers();

      if (selectedSupplier) {
        const updatedSupplier = suppliers.find(s => s.id === selectedSupplier.id);
        if (updatedSupplier) {
          setSelectedSupplier(updatedSupplier);
        }
      }
    } catch (error) {
      console.error('Error deleting supplier ports:', error);
    }
  };

  const handleCheckPortDuplicates = () => {
    setShowSupplierPortDuplicatesModal(true);
  };

  const loadTasks = async () => {
    if (!currentWorkspace?.id) return;
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
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
          workspace_id: currentWorkspace?.id,
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

  const handleLogCallFromSchedule = (contactId: string, scheduleInfo?: Partial<CallSchedule>) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setSelectedContact(contact);
      setEditingCall(undefined);
      setScheduleData(scheduleInfo);
      setShowCallModal(true);
    }
  };

  const handleLogEmailFromSchedule = (contactId: string, scheduleInfo?: Partial<CallSchedule>) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setSelectedContact(contact);
      setEditingEmail(undefined);
      setScheduleData(scheduleInfo);
      setShowEmailModal(true);
    }
  };

  const loadButtonOrder = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('button_order, visible_filters, panel_order, panel_spacing, custom_priority_labels, oil_prices_order, visible_oil_prices')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        if (data.button_order) {
          const defaultButtons = ['copy-emails', 'export', 'history', 'duplicates', 'delete-all', 'settings', 'import', 'bulk-search', 'add-contact', 'alerts', 'stats'];
          const savedOrder = data.button_order as string[];
          const newButtons = defaultButtons.filter(btn => !savedOrder.includes(btn));
          setButtonOrder([...savedOrder, ...newButtons]);
        }
        if (data.visible_filters) {
          setVisibleFilters(data.visible_filters as typeof visibleFilters);
        }
        if (data.panel_order) {
          setPanelOrder(data.panel_order);
        }
        if (data.panel_spacing !== null && data.panel_spacing !== undefined) {
          setPanelSpacing(data.panel_spacing);
        }
        if (data.custom_priority_labels) {
          const defaultLabels = {
            0: 'Client',
            1: 'Highest',
            2: 'High',
            3: 'Medium',
            4: 'Low',
            5: 'Lowest'
          };
          setCustomPriorityLabels({ ...defaultLabels, ...data.custom_priority_labels });
        }
        if (data.oil_prices_order) {
          const defaultOrder = ['WTI', 'Brent', 'MGO', 'VLSFO', 'IFO 380'];
          const existingOrder = data.oil_prices_order;
          const newTypes = defaultOrder.filter(type => !existingOrder.includes(type));
          const mergedOrder = [...existingOrder, ...newTypes];
          setOilPricesOrder(mergedOrder);
        }
        if (data.visible_oil_prices) {
          const defaultVisible = ['WTI', 'Brent', 'MGO', 'VLSFO', 'IFO 380'];
          const existingVisible = data.visible_oil_prices;
          const newTypes = defaultVisible.filter(type => !existingVisible.includes(type));
          const mergedVisible = [...existingVisible, ...newTypes];
          setVisibleOilPrices(mergedVisible);
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

  const handleSaveOilPricesOrder = async (order: string[]) => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ oil_prices_order: order })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert([{ user_id: user.id, oil_prices_order: order }]);

        if (error) throw error;
      }

      setOilPricesOrder(order);
    } catch (error) {
      console.error('Error saving oil prices order:', error);
    }
  };

  const handleSaveVisibleOilPrices = async (visible: string[]) => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ visible_oil_prices: visible })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert([{ user_id: user.id, visible_oil_prices: visible }]);

        if (error) throw error;
      }

      setVisibleOilPrices(visible);
    } catch (error) {
      console.error('Error saving visible oil prices:', error);
    }
  };

  const handleSavePanelOrder = async (order: string[]) => {
    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ panel_order: order })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert([{ user_id: user.id, panel_order: order }]);

        if (error) throw error;
      }

      setPanelOrder(order);
    } catch (error) {
      console.error('Error saving panel order:', error);
    }
  };

  const handleSavePanelSpacing = async (spacing: number) => {
    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ panel_spacing: spacing })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert([{ user_id: user.id, panel_spacing: spacing }]);

        if (error) throw error;
      }

      setPanelSpacing(spacing);
    } catch (error) {
      console.error('Error saving panel spacing:', error);
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
      .filter(c => !c.is_dead)
      .map(c => c.email)
      .filter(Boolean)
      .join('; ');

    if (emails) {
      navigator.clipboard.writeText(emails).then(() => {
        alert(`Copied ${filteredContacts.filter(c => c.email && !c.is_dead).length} email addresses to clipboard!`);
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
      'bulk-search': (
        <button
          key="bulk-search"
          onClick={() => setShowBulkSearchModal(true)}
          className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Search className="w-5 h-5" />
          Bulk Search
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
      'alerts': (
        <button
          key="alerts"
          onClick={() => setShowNotificationSettings(true)}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Bell className="w-5 h-5" />
          Alerts
        </button>
      ),
      'stats': (
        <button
          key="stats"
          onClick={() => setShowStatsModal(true)}
          className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <PieChart className="w-5 h-5" />
          Statistics
        </button>
      ),
    };

    return (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowButtonOrderSettings(true)}
          className="px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          title="Organize Buttons"
        >
          <ArrowUpDown className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowPanelOrderSettings(true)}
          className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          title="Panel Order"
        >
          <Layers className="w-5 h-5" />
        </button>
        {buttonOrder.map(id => buttonComponents[id]).filter(Boolean)}
      </div>
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
      {showGoalProgressBox && <GoalProgressBox onSelectContact={handleSelectContactFromGoals} onLogCall={handleLogCallFromSchedule} onLogEmail={handleLogEmailFromSchedule} showNotepad={showNotepad} panelOrder={panelOrder} showGoals={showGoalProgressBox && hasGoals} showPriority={showPriorityPanel} notepadExpanded={notepadExpanded} goalsExpanded={goalsExpanded} priorityExpanded={priorityExpanded} onExpandedChange={setGoalsExpanded} onHasGoalsChange={setHasGoals} panelSpacing={panelSpacing} onClose={() => {
        setShowGoalProgressBox(false);
        localStorage.setItem('goalProgressBoxVisible', 'false');
      }} />}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                currentPage === 'contacts' ? 'bg-blue-600' :
                currentPage === 'suppliers' ? 'bg-green-600' :
                currentPage === 'priority' ? 'bg-purple-600' :
                currentPage === 'notes' ? 'bg-amber-600' :
                currentPage === 'calendar' ? 'bg-teal-600' :
                'bg-orange-600'
              }`}>
                {currentPage === 'contacts' ? (
                  <Users className="w-8 h-8 text-white" />
                ) : currentPage === 'suppliers' ? (
                  <Package className="w-8 h-8 text-white" />
                ) : currentPage === 'priority' ? (
                  <TrendingUp className="w-8 h-8 text-white" />
                ) : currentPage === 'notes' ? (
                  <StickyNote className="w-8 h-8 text-white" />
                ) : currentPage === 'calendar' ? (
                  <Calendar className="w-8 h-8 text-white" />
                ) : (
                  <CheckSquare className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-bold text-gray-900">
                  {currentPage === 'contacts' ? 'Contact Tracker' :
                   currentPage === 'suppliers' ? 'Supplier Tracker' :
                   currentPage === 'priority' ? 'Priority List' :
                   currentPage === 'notes' ? 'Notes' :
                   currentPage === 'calendar' ? 'Calendar' :
                   'Task Manager'}
                </h1>
                <div className="relative">
                  <button
                    onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 text-sm"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentWorkspace?.color || '#3B82F6' }}
                    />
                    <span className="text-gray-700 font-medium">
                      {currentWorkspace?.name || 'Loading...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {showWorkspaceDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-50">
                      {workspaces.map((workspace) => (
                        <button
                          key={workspace.id}
                          onClick={() => {
                            setCurrentWorkspace(workspace);
                            setShowWorkspaceDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors ${
                            currentWorkspace?.id === workspace.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: workspace.color }}
                          />
                          <span className="text-gray-700 font-medium">{workspace.name}</span>
                          {workspace.is_default && (
                            <span className="ml-auto text-xs text-gray-500">Default</span>
                          )}
                        </button>
                      ))}
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={() => {
                            setShowWorkspaceModal(true);
                            setShowWorkspaceDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-blue-600"
                        >
                          <FolderOpen className="w-4 h-4" />
                          <span className="font-medium">Manage Workspaces</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-0.5">
              <button
                onClick={() => setShowNotepad(!showNotepad)}
                className={`flex-shrink-0 flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-lg transition-colors ${
                  showNotepad
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
                title={showNotepad ? 'Hide Notes' : 'Show Notes'}
              >
                <StickyNote className="w-5 h-5" />
                <span className="hidden sm:inline whitespace-nowrap">Notes</span>
              </button>
              <button
                onClick={() => {
                  const newValue = !showGoalProgressBox;
                  setShowGoalProgressBox(newValue);
                  localStorage.setItem('goalProgressBoxVisible', String(newValue));
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-lg transition-colors ${
                  showGoalProgressBox
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
                title={showGoalProgressBox ? 'Hide Goals' : 'Show Goals'}
              >
                <Target className="w-5 h-5" />
                <span className="hidden sm:inline whitespace-nowrap">Goals</span>
              </button>
              <button
                onClick={() => setShowPriorityPanel(!showPriorityPanel)}
                className={`flex-shrink-0 flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-lg transition-colors ${
                  showPriorityPanel
                    ? 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
                title={showPriorityPanel ? 'Hide Priority' : 'Show Priority'}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="hidden sm:inline whitespace-nowrap">Priority</span>
              </button>
              <button
                onClick={() => setShowMGOPrices(!showMGOPrices)}
                className={`flex-shrink-0 flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-lg transition-colors ${
                  showMGOPrices
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
                title={showMGOPrices ? 'Hide Oil Prices' : 'Show Oil Prices'}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="hidden sm:inline whitespace-nowrap">Oil Prices</span>
              </button>
              <button
                onClick={() => setShowAccountSettings(true)}
                className="flex-shrink-0 flex items-center gap-2 px-2.5 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                title="Account Settings"
              >
                <UserCog className="w-5 h-5" />
                <span className="hidden sm:inline whitespace-nowrap">Account</span>
              </button>
              <button
                onClick={signOut}
                className="flex-shrink-0 flex items-center gap-2 px-2.5 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline whitespace-nowrap">Sign Out</span>
              </button>
            </div>
          </div>
          <p className="text-gray-600 ml-0 lg:ml-16">
            {currentPage === 'contacts'
              ? 'Manage your contacts and track your calls and emails'
              : currentPage === 'suppliers'
              ? 'Manage your suppliers and track purchase orders'
              : currentPage === 'priority'
              ? 'View and manage your priority-ranked contacts'
              : currentPage === 'notes'
              ? 'Your saved notes and important information'
              : currentPage === 'calendar'
              ? 'View tasks, goals, and communications in calendar format'
              : 'Manage your tasks and stay on top of follow-ups'}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200 w-full sm:w-fit">
          <button
            onClick={() => {
              setCurrentPage('contacts');
              setSearchQuery('');
            }}
            className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentPage === 'contacts'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="whitespace-nowrap">Contacts</span>
          </button>
          <button
            onClick={() => {
              setCurrentPage('priority');
              setSearchQuery('');
            }}
            className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentPage === 'priority'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="whitespace-nowrap">Priority</span>
          </button>
          <button
            onClick={() => {
              setCurrentPage('suppliers');
              setSearchQuery('');
            }}
            className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentPage === 'suppliers'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="whitespace-nowrap">Suppliers</span>
          </button>
          <button
            onClick={() => {
              setCurrentPage('tasks');
              setSearchQuery('');
            }}
            className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentPage === 'tasks'
                ? 'bg-orange-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="whitespace-nowrap">Tasks</span>
          </button>
          <button
            onClick={() => {
              setCurrentPage('notes');
              setSearchQuery('');
            }}
            className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentPage === 'notes'
                ? 'bg-amber-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <StickyNote className="w-4 h-4" />
            <span className="whitespace-nowrap">Notes</span>
          </button>
          <button
            onClick={() => {
              setCurrentPage('calendar');
              setSearchQuery('');
            }}
            className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentPage === 'calendar'
                ? 'bg-teal-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="whitespace-nowrap">Calendar</span>
          </button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {currentPage !== 'tasks' && currentPage !== 'notes' && currentPage !== 'calendar' && (
            <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'grid'
                    ? currentPage === 'contacts'
                      ? 'bg-blue-600 text-white'
                      : currentPage === 'priority'
                      ? 'bg-purple-600 text-white'
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
                      : currentPage === 'priority'
                      ? 'bg-purple-600 text-white'
                      : 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Table View"
              >
                <Table className="w-4 h-4" />
              </button>
              {currentPage === 'suppliers' && (
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    viewMode === 'map'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Map View"
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          {currentPage === 'contacts' || currentPage === 'priority' ? (
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
          ) : currentPage === 'tasks' ? (
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
          ) : (
            <button
              onClick={handleAddNote}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Note
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
                    emailType: 'Email Type',
                    phone: 'Phone',
                    phoneType: 'Phone Type',
                    city: 'City',
                    postCode: 'Post Code',
                    website: 'Website',
                    address: 'Address',
                    country: 'Country',
                    timezone: 'Timezone',
                    priority: 'Priority'
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
                <button
                  onClick={() => setStatusFilters(prev => ({ ...prev, isDead: !prev.isDead }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilters.isDead
                      ? 'bg-gray-800 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Is Dead
                </button>
                <button
                  onClick={() => setStatusFilters(prev => ({ ...prev, none: !prev.none }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilters.none
                      ? 'bg-gray-700 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  None
                </button>
              </div>
            </div>

            {statusFilters.isJammed && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Jammed Reasons
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({contacts.filter(c => c.is_jammed).length} jammed contacts)
                  </span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={jammedReasonFilter}
                      onChange={(e) => setJammedReasonFilter(e.target.value)}
                      placeholder="Search in jammed notes..."
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {jammedReasonFilter && (
                      <button
                        onClick={() => setJammedReasonFilter('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {(() => {
                    const reasonCounts = new Map<string, number>();
                    contacts
                      .filter(c => c.is_jammed && (c.jammed_note || c.jammed_additional_note))
                      .forEach(c => {
                        [c.jammed_note, c.jammed_additional_note]
                          .filter(Boolean)
                          .forEach(note => {
                            const trimmed = note!.trim();
                            reasonCounts.set(trimmed, (reasonCounts.get(trimmed) || 0) + 1);
                          });
                      });

                    const sortedReasons = Array.from(reasonCounts.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10);

                    return sortedReasons.length > 0 ? (
                      <>
                        <p className="text-xs text-gray-500">Common reasons (click to filter):</p>
                        <div className="flex flex-wrap gap-2">
                          {sortedReasons.map(([reason, count]) => (
                            <button
                              key={reason}
                              onClick={() => setJammedReasonFilter(reason)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors flex items-center gap-1"
                              title={reason}
                            >
                              <span>{reason.length > 30 ? `${reason.substring(0, 30)}...` : reason}</span>
                              <span className="bg-red-200 px-1.5 rounded-full text-[10px] font-semibold">
                                {count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            {statusFilters.hasTraction && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Traction Reasons
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({contacts.filter(c => c.has_traction).length} traction contacts)
                  </span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={tractionReasonFilter}
                      onChange={(e) => setTractionReasonFilter(e.target.value)}
                      placeholder="Search in traction notes..."
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {tractionReasonFilter && (
                      <button
                        onClick={() => setTractionReasonFilter('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {(() => {
                    const reasonCounts = new Map<string, number>();
                    contacts
                      .filter(c => c.has_traction && c.traction_note)
                      .forEach(c => {
                        const trimmed = c.traction_note!.trim();
                        reasonCounts.set(trimmed, (reasonCounts.get(trimmed) || 0) + 1);
                      });

                    const sortedReasons = Array.from(reasonCounts.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10);

                    return sortedReasons.length > 0 ? (
                      <>
                        <p className="text-xs text-gray-500">Common reasons (click to filter):</p>
                        <div className="flex flex-wrap gap-2">
                          {sortedReasons.map(([reason, count]) => (
                            <button
                              key={reason}
                              onClick={() => setTractionReasonFilter(reason)}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors flex items-center gap-1"
                              title={reason}
                            >
                              <span>{reason.length > 30 ? `${reason.substring(0, 30)}...` : reason}</span>
                              <span className="bg-green-200 px-1.5 rounded-full text-[10px] font-semibold">
                                {count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            {statusFilters.isClient && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Client Reasons
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({contacts.filter(c => c.is_client).length} client contacts)
                  </span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={clientReasonFilter}
                      onChange={(e) => setClientReasonFilter(e.target.value)}
                      placeholder="Search in client notes..."
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {clientReasonFilter && (
                      <button
                        onClick={() => setClientReasonFilter('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {(() => {
                    const reasonCounts = new Map<string, number>();
                    contacts
                      .filter(c => c.is_client && c.client_note)
                      .forEach(c => {
                        const trimmed = c.client_note!.trim();
                        reasonCounts.set(trimmed, (reasonCounts.get(trimmed) || 0) + 1);
                      });

                    const sortedReasons = Array.from(reasonCounts.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10);

                    return sortedReasons.length > 0 ? (
                      <>
                        <p className="text-xs text-gray-500">Common reasons (click to filter):</p>
                        <div className="flex flex-wrap gap-2">
                          {sortedReasons.map(([reason, count]) => (
                            <button
                              key={reason}
                              onClick={() => setClientReasonFilter(reason)}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1"
                              title={reason}
                            >
                              <span>{reason.length > 30 ? `${reason.substring(0, 30)}...` : reason}</span>
                              <span className="bg-blue-200 px-1.5 rounded-full text-[10px] font-semibold">
                                {count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            {statusFilters.isDead && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Dead Reasons
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({contacts.filter(c => c.is_dead).length} dead contacts)
                  </span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={deadReasonFilter}
                      onChange={(e) => setDeadReasonFilter(e.target.value)}
                      placeholder="Search in dead notes..."
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {deadReasonFilter && (
                      <button
                        onClick={() => setDeadReasonFilter('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {(() => {
                    const reasonCounts = new Map<string, number>();
                    contacts
                      .filter(c => c.is_dead && (c.dead_note || c.dead_additional_note))
                      .forEach(c => {
                        const trimmed = (c.dead_additional_note || c.dead_note || '').trim();
                        if (trimmed) {
                          reasonCounts.set(trimmed, (reasonCounts.get(trimmed) || 0) + 1);
                        }
                      });

                    const sortedReasons = Array.from(reasonCounts.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10);

                    return sortedReasons.length > 0 ? (
                      <>
                        <p className="text-xs text-gray-500">Common reasons (click to filter):</p>
                        <div className="flex flex-wrap gap-2">
                          {sortedReasons.map(([reason, count]) => (
                            <button
                              key={reason}
                              onClick={() => setDeadReasonFilter(reason)}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-1"
                              title={reason}
                            >
                              <span>{reason.length > 30 ? `${reason.substring(0, 30)}...` : reason}</span>
                              <span className="bg-gray-200 px-1.5 rounded-full text-[10px] font-semibold">
                                {count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {visibleFilters.name && (
                <MultiSelectDropdown
                  label="Name"
                  options={['[None]', ...Array.from(new Set(contacts.map((c) => c.name).filter(Boolean))).sort()]}
                  selectedValues={filterNames}
                  onChange={setFilterNames}
                  placeholder="Select names..."
                />
              )}

              {visibleFilters.company && (
                <MultiSelectDropdown
                  label="Company"
                  options={['[None]', ...Array.from(new Set(contacts.map((c) => c.company).filter(Boolean) as string[])).sort()]}
                  selectedValues={filterCompanies}
                  onChange={setFilterCompanies}
                  placeholder="Select companies..."
                />
              )}

              {visibleFilters.companySize && (
                <MultiSelectDropdown
                  label="Company Size"
                  options={['[None]', ...Array.from(new Set(contacts.map((c) => c.company_size).filter(Boolean) as string[])).sort()]}
                  selectedValues={filterCompanySizes}
                  onChange={setFilterCompanySizes}
                  placeholder="Select company sizes..."
                />
              )}

              {visibleFilters.email && (
                <MultiSelectDropdown
                  label="Email"
                  options={['[None]', ...Array.from(new Set(contacts.map((c) => c.email).filter(Boolean) as string[])).sort()]}
                  selectedValues={filterEmails}
                  onChange={setFilterEmails}
                  placeholder="Select emails..."
                />
              )}

              {visibleFilters.emailType && (
                <MultiSelectDropdown
                  label="Email Type"
                  options={[
                    '[None]',
                    ...Array.from(new Set([
                      ...contacts.map(c => c.email_type).filter(Boolean),
                      ...contacts.flatMap(c => c.contact_persons || []).map(cp => cp.email_type).filter(Boolean)
                    ] as string[])).sort((a, b) => {
                      const order = ['personal', 'general'];
                      const indexA = order.indexOf(a.toLowerCase());
                      const indexB = order.indexOf(b.toLowerCase());
                      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                      if (indexA === -1) return 1;
                      if (indexB === -1) return -1;
                      return indexA - indexB;
                    })
                  ]}
                  selectedValues={filterEmailTypes}
                  onChange={setFilterEmailTypes}
                  placeholder="Select email types..."
                />
              )}

              {visibleFilters.phone && (
                <MultiSelectDropdown
                  label="Phone"
                  options={['[None]', ...Array.from(new Set(contacts.map((c) => c.phone).filter(Boolean) as string[])).sort()]}
                  selectedValues={filterPhones}
                  onChange={setFilterPhones}
                  placeholder="Select phones..."
                />
              )}

              {visibleFilters.phoneType && (
                <MultiSelectDropdown
                  label="Phone Type"
                  options={[
                    '[None]',
                    ...Array.from(new Set([
                      ...contacts.map(c => c.phone_type).filter(Boolean),
                      ...contacts.flatMap(c => c.contact_persons || []).map(cp => cp.phone_type).filter(Boolean),
                      ...contacts.flatMap(c => c.contact_persons || []).map(cp => cp.mobile_type).filter(Boolean)
                    ] as string[])).sort((a, b) => {
                      const order = ['office', 'mobile', 'whatsapp', 'wechat', 'general'];
                      const indexA = order.indexOf(a.toLowerCase());
                      const indexB = order.indexOf(b.toLowerCase());
                      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                      if (indexA === -1) return 1;
                      if (indexB === -1) return -1;
                      return indexA - indexB;
                    })
                  ]}
                  selectedValues={filterPhoneTypes}
                  onChange={setFilterPhoneTypes}
                  placeholder="Select phone types..."
                />
              )}

              {visibleFilters.city && (
                <MultiSelectDropdown
                  label="City"
                  options={['[None]', ...Array.from(new Set(contacts.map((c) => c.city).filter(Boolean) as string[])).sort()]}
                  selectedValues={filterCities}
                  onChange={setFilterCities}
                  placeholder="Select cities..."
                />
              )}

              {visibleFilters.postCode && (
                <MultiSelectDropdown
                  label="Post Code"
                  options={['[None]', ...Array.from(new Set(contacts.map((c) => c.post_code).filter(Boolean) as string[])).sort()]}
                  selectedValues={filterPostCodes}
                  onChange={setFilterPostCodes}
                  placeholder="Select post codes..."
                />
              )}

              {visibleFilters.website && (
                <MultiSelectDropdown
                  label="Website"
                  options={['[None]', ...Array.from(new Set(contacts.map((c) => c.website).filter(Boolean) as string[])).sort()]}
                  selectedValues={filterWebsites}
                  onChange={setFilterWebsites}
                  placeholder="Select websites..."
                />
              )}

              {visibleFilters.address && (
                <MultiSelectDropdown
                  label="Address"
                  options={['[None]', ...Array.from(new Set(contacts.map((c) => c.address).filter(Boolean) as string[])).sort()]}
                  selectedValues={filterAddresses}
                  onChange={setFilterAddresses}
                  placeholder="Select addresses..."
                />
              )}

              {visibleFilters.country && (
                <MultiSelectDropdown
                  label="Country"
                  options={['[None]', ...Array.from(new Set(contacts.map((c) => c.country).filter(Boolean) as string[])).sort()]}
                  selectedValues={filterCountries}
                  onChange={setFilterCountries}
                  placeholder="Select countries..."
                />
              )}

              {visibleFilters.timezone && (
                <MultiSelectDropdown
                  label="Timezone"
                  options={['[None]', ...Array.from(new Set(contacts.map((c) => c.timezone).filter(Boolean) as string[])).sort()]}
                  selectedValues={filterTimezones}
                  onChange={setFilterTimezones}
                  placeholder="Select timezones..."
                />
              )}

              {visibleFilters.priority && (
                <MultiSelectDropdown
                  label="Priority"
                  options={[
                    '[None]',
                    '0 - Client',
                    '1 - Highest',
                    '2 - High',
                    '3 - Medium',
                    '4 - Low',
                    '5 - Lowest'
                  ]}
                  selectedValues={filterPriorities.map(p => {
                    if (p === '[None]') return '[None]';
                    const labels = {
                      '0': '0 - Client',
                      '1': '1 - Highest',
                      '2': '2 - High',
                      '3': '3 - Medium',
                      '4': '4 - Low',
                      '5': '5 - Lowest'
                    };
                    return labels[p as keyof typeof labels] || p;
                  })}
                  onChange={(selected) => {
                    const values = selected.map(s => {
                      if (s === '[None]') return '[None]';
                      return s.split(' ')[0];
                    });
                    setFilterPriorities(values);
                  }}
                  placeholder="Select priorities..."
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
                  <option value="email_type">Email Type</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
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
          {(filterNames.length > 0 || filterCompanies.length > 0 || filterCompanySizes.length > 0 || filterEmails.length > 0 || filterPhones.length > 0 || filterCities.length > 0 || filterPostCodes.length > 0 || filterWebsites.length > 0 || filterAddresses.length > 0 || filterCountries.length > 0 || filterTimezones.length > 0 || statusFilters.hasTraction || statusFilters.isClient || statusFilters.isJammed || statusFilters.none || activityDateFilter !== 'all' || jammedReasonFilter.trim() || tractionReasonFilter.trim() || clientReasonFilter.trim()) && (
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
                  setStatusFilters({ hasTraction: false, isClient: false, isJammed: false, none: false });
                  setActivityDateFilter('all');
                  setJammedReasonFilter('');
                  setTractionReasonFilter('');
                  setClientReasonFilter('');
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Filter & Sort Suppliers</h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={supplierSortBy}
                  onChange={(e) => setSupplierSortBy(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="name">Company Name</option>
                  <option value="type">Supplier Type</option>
                  <option value="classification">Business Classification</option>
                  <option value="country">Country</option>
                  <option value="region">Region</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={supplierSearchQuery}
                  onChange={(e) => setSupplierSearchQuery(e.target.value)}
                  placeholder="Search suppliers, ports, regions, fuel types..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {supplierSearchQuery && (
                  <button
                    onClick={() => setSupplierSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Regions</option>
                  {Array.from(new Set(
                    suppliers
                      .flatMap(s => s.regions?.map(r => r.name) || [])
                      .filter(Boolean)
                  )).sort().map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
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
                    suppliers.flatMap((s) => {
                      const detailedPorts = s.ports_detailed?.map(p => p.port_name) || [];
                      const legacyPorts = s.ports?.split(';').map(p => p.trim()) || [];
                      return [...detailedPorts, ...legacyPorts];
                    }).filter(Boolean)
                  )).sort().map((port) => (
                    <option key={port} value={port}>
                      {port}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Method
                </label>
                <select
                  value={filterDeliveryMethod}
                  onChange={(e) => setFilterDeliveryMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Methods</option>
                  <option value="barge">Barge</option>
                  <option value="truck">Truck</option>
                  <option value="expipe">Ex-Pipe</option>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Classification
                </label>
                <select
                  value={filterBusinessClassification}
                  onChange={(e) => setFilterBusinessClassification(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Classifications</option>
                  <option value="Trader">Trader</option>
                  <option value="Supplier">Supplier</option>
                  <option value="Trader/Supplier">Trader/Supplier</option>
                </select>
              </div>
            </div>
            {filterPort !== 'all' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emails for {filterPort}
                </label>
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    readOnly
                    value={suppliers
                      .filter(s => {
                        if (!s.ports) return false;
                        const ports = s.ports.split(';').map(p => p.trim().toLowerCase());
                        return ports.some(port => port.includes(filterPort.toLowerCase()));
                      })
                      .map(s => {
                        const emails = [];
                        if (s.general_email) emails.push(s.general_email);
                        if (s.email) emails.push(s.email);
                        return emails.join('; ');
                      })
                      .filter(Boolean)
                      .join('; ')}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                    onClick={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.select();
                      navigator.clipboard.writeText(input.value);
                    }}
                  />
                  <button
                    onClick={() => {
                      const emails = suppliers
                        .filter(s => {
                          if (!s.ports) return false;
                          const ports = s.ports.split(';').map(p => p.trim().toLowerCase());
                          return ports.some(port => port.includes(filterPort.toLowerCase()));
                        })
                        .map(s => {
                          const emails = [];
                          if (s.general_email) emails.push(s.general_email);
                          if (s.email) emails.push(s.email);
                          return emails.join('; ');
                        })
                        .filter(Boolean)
                        .join('; ');
                      navigator.clipboard.writeText(emails);
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                  >
                    Copy All
                  </button>
                </div>
              </div>
            )}
            {(supplierSearchQuery.trim() !== '' || filterPort !== 'all' || filterFuelType !== 'all' || filterDeliveryMethod !== 'all' || filterRegion !== 'all' || filterBusinessClassification !== 'all') && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {filteredSuppliers.length} of {suppliers.length} suppliers
                </span>
                <button
                  onClick={() => {
                    setSupplierSearchQuery('');
                    setFilterPort('all');
                    setFilterFuelType('all');
                    setFilterDeliveryMethod('all');
                    setFilterRegion('all');
                    setFilterBusinessClassification('all');
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
              notes={savedNotes}
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
          ) : viewMode === 'table' ? (
            <SupplierTableView
              suppliers={filteredSuppliers}
              onSupplierClick={handleSupplierClick}
              onDeleteSupplier={handleDeleteSupplier}
              onEditSupplier={handleEditSupplier}
              onEditPort={(port) => {
                setEditingSupplierPort(port);
                setShowSupplierPortModal(true);
              }}
            />
          ) : (
            <SupplierMapView
              suppliers={filteredSuppliers}
              onSelectSupplier={handleSupplierClick}
            />
          )
        ) : currentPage === 'tasks' ? (
          <>
            <DailyGoals
              calls={contacts.flatMap(c => c.calls)}
              emails={contacts.flatMap(c => c.emails)}
              deals={contacts.flatMap(c => c.fuel_deals)}
              contacts={contacts}
              onAddTask={() => {
                setEditingTask(undefined);
                setShowTaskModal(true);
              }}
              onSelectContact={handleSelectContactFromGoals}
              onLogCall={handleLogCallFromSchedule}
              onLogEmail={handleLogEmailFromSchedule}
            />
            <TaskList
              tasks={filteredTasks}
              onToggleComplete={handleToggleTaskComplete}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
            />
          </>
        ) : currentPage === 'calendar' ? (
          <CalendarView
            tasks={tasks}
            goals={completedGoals}
            communications={[
              ...contacts.flatMap(c => c.calls.map(call => ({
                id: call.id,
                contact_id: c.id,
                type: 'call' as const,
                date: call.call_date,
                contact_name: c.name,
                notes: call.notes,
              }))),
              ...contacts.flatMap(c => c.emails.map(email => ({
                id: email.id,
                contact_id: c.id,
                type: 'email' as const,
                date: email.email_date,
                contact_name: c.name,
                notes: email.notes,
              }))),
            ]}
            fuelDeals={contacts.flatMap(c => c.fuel_deals)}
            followUps={contacts
              .filter(c => c.follow_up_date)
              .map(c => ({
                id: c.id,
                contact_id: c.id,
                contact_name: c.name || c.company || 'Unknown',
                follow_up_date: c.follow_up_date!,
                follow_up_reason: c.follow_up_reason,
              }))}
            onTaskClick={handleEditTask}
            onDateClick={(date) => {
              setSelectedDate(date);
              setShowDayScheduleModal(true);
            }}
          />
        ) : currentPage === 'notes' ? (
          <NotesSection
            notes={savedNotes}
            contacts={contacts}
            onAddNote={handleAddNote}
            onEditNote={handleEditSavedNote}
            onDeleteNote={handleDeleteSavedNote}
          />
        ) : currentPage === 'priority' ? (
          <PriorityList
            contacts={filteredContacts}
            onContactClick={handleContactClick}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
            customPriorityLabels={customPriorityLabels}
          />
        ) : null}
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
          notes={savedNotes.filter(n => n.contact_id === selectedContact.id)}
          onClose={() => {
            setShowContactDetail(false);
            setSelectedContact(undefined);
            loadContacts();
          }}
          onEdit={() => {
            setEditingContact(selectedContact);
            setShowContactDetail(false);
            setShowContactModal(true);
          }}
          onEditContact={handleUpdateContact}
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
          onDeleteCall={handleDeleteCall}
          onDeleteEmail={handleDeleteEmail}
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
          onEditNote={handleEditSavedNote}
          onDeleteNote={handleDeleteSavedNote}
          onDelete={handleDeleteContact}
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
          contactId={selectedContact.id}
          contactName={selectedContact.name}
          contacts={contacts}
          suppliers={suppliers}
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
          contactId={selectedContact.id}
          contactName={selectedContact.name}
          contactPersons={selectedContact.contact_persons}
          contacts={contacts}
          suppliers={suppliers}
          scheduleData={scheduleData}
          onClose={() => {
            setShowCallModal(false);
            setEditingCall(undefined);
            setScheduleData(undefined);
          }}
          onSave={handleSaveCall}
        />
      )}

      {showEmailModal && selectedContact && (
        <EmailModal
          email={editingEmail}
          contactId={selectedContact.id}
          contactName={selectedContact.name}
          contactPersons={selectedContact.contact_persons}
          contacts={contacts}
          suppliers={suppliers}
          scheduleData={scheduleData}
          onClose={() => {
            setShowEmailModal(false);
            setEditingEmail(undefined);
            setScheduleData(undefined);
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
          panelSpacing={panelSpacing}
          onSavePanelSpacing={handleSavePanelSpacing}
          onOpenPriorityLabels={() => {
            setShowSettingsModal(false);
            setShowPriorityLabelSettings(true);
          }}
        />
      )}

      {showPriorityLabelSettings && user && (
        <PriorityLabelSettings
          onClose={() => setShowPriorityLabelSettings(false)}
          userId={user.id}
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
          onEdit={() => {
            setShowSupplierDetail(false);
            setEditingSupplier(selectedSupplier);
            setShowSupplierModal(true);
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
          onAddPort={() => {
            setEditingSupplierPort(undefined);
            setShowSupplierPortModal(true);
          }}
          onEditPort={(port) => {
            setEditingSupplierPort(port);
            setShowSupplierPortModal(true);
          }}
          onDeletePort={handleDeleteSupplierPort}
          onCheckPortDuplicates={handleCheckPortDuplicates}
          onAddTask={() => handleAddTaskForSupplier(selectedSupplier.id)}
          onToggleTaskComplete={handleToggleTaskComplete}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onConvertToContact={handleConvertSupplierToContact}
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

      {showSupplierPortModal && selectedSupplier && (
        <SupplierPortModal
          supplierPort={editingSupplierPort}
          supplierId={selectedSupplier.id}
          onClose={() => {
            setShowSupplierPortModal(false);
            setEditingSupplierPort(undefined);
          }}
          onSave={handleSaveSupplierPort}
        />
      )}

      {showSupplierPortDuplicatesModal && selectedSupplier && (
        <SupplierPortDuplicatesModal
          supplierId={selectedSupplier.id}
          ports={selectedSupplier.ports_detailed || []}
          onClose={() => setShowSupplierPortDuplicatesModal(false)}
          onDeletePorts={handleDeleteMultipleSupplierPorts}
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

      {showDayScheduleModal && selectedDate && (
        <DayScheduleModal
          date={selectedDate}
          tasks={tasks}
          calls={contacts.flatMap(c => c.calls.map(call => ({
            ...call,
            contact_name: c.name,
            contact_id: c.id,
            priority_rank: c.priority_rank
          })))}
          emails={contacts.flatMap(c => c.emails.map(email => ({
            ...email,
            contact_name: c.name,
            contact_id: c.id,
            priority_rank: c.priority_rank
          })))}
          fuelDeals={contacts.flatMap(c => c.fuel_deals.map(deal => ({
            ...deal,
            contact_name: c.name,
            contact_id: c.id,
            priority_rank: c.priority_rank
          })))}
          followUps={contacts
            .filter(c => c.follow_up_date)
            .map(c => ({
              id: c.id,
              contact_id: c.id,
              contact_name: c.name || c.company || 'Unknown',
              follow_up_date: c.follow_up_date!,
              follow_up_reason: c.follow_up_reason,
              priority_rank: c.priority_rank
            }))}
          onClose={() => {
            setShowDayScheduleModal(false);
            setSelectedDate(null);
          }}
          onTaskClick={handleEditTask}
          onCreateTask={() => {
            setEditingTask(undefined);
            setShowTaskModal(true);
          }}
          onToggleTask={handleToggleTaskComplete}
          onContactClick={(contactId) => {
            const contact = contacts.find(c => c.id === contactId);
            if (contact) {
              setSelectedContact(contact);
              setShowContactDetail(true);
              setShowDayScheduleModal(false);
            }
          }}
          onCallClick={(call) => {
            const contact = contacts.find(c => c.calls.some(cc => cc.id === call.id));
            if (contact) {
              setSelectedContact(contact);
              setEditingCall(call);
              setShowCallModal(true);
              setShowDayScheduleModal(false);
            }
          }}
          onEmailClick={(email) => {
            const contact = contacts.find(c => c.emails.some(e => e.id === email.id));
            if (contact) {
              setSelectedContact(contact);
              setEditingEmail(email);
              setShowEmailModal(true);
              setShowDayScheduleModal(false);
            }
          }}
          onFuelDealClick={(deal) => {
            const contact = contacts.find(c => c.fuel_deals.some(d => d.id === deal.id));
            if (contact) {
              setSelectedContact(contact);
              setEditingFuelDeal(deal);
              setShowFuelDealModal(true);
              setShowDayScheduleModal(false);
            }
          }}
          customPriorityLabels={customPriorityLabels}
        />
      )}

      {showNoteModal && (
        <NoteModal
          isOpen={showNoteModal}
          note={editingNote}
          contacts={contacts}
          onClose={() => {
            setShowNoteModal(false);
            setEditingNote(undefined);
          }}
          onSave={handleSaveSavedNote}
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

      {showPanelOrderSettings && (
        <PanelOrderSettings
          currentOrder={panelOrder}
          onClose={() => setShowPanelOrderSettings(false)}
          onSave={handleSavePanelOrder}
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

      {showBulkSearchModal && (
        <BulkSearchModal
          contacts={contacts}
          onClose={() => setShowBulkSearchModal(false)}
          onSelectContact={handleContactClick}
          currentWorkspace={currentWorkspace}
          onRefresh={loadContacts}
        />
      )}

      {showAccountSettings && (
        <AccountSettings
          onClose={() => setShowAccountSettings(false)}
        />
      )}

      <NotificationSettingsModal
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />

      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        contacts={contacts}
      />

      <MGOPricesModal
        isOpen={showMGOPrices}
        onClose={() => setShowMGOPrices(false)}
        showGoals={showGoalProgressBox && hasGoals}
        showNotepad={showNotepad}
        showPriority={showPriorityPanel}
        panelOrder={panelOrder}
        notepadExpanded={notepadExpanded}
        goalsExpanded={goalsExpanded}
        priorityExpanded={priorityExpanded}
        panelSpacing={panelSpacing}
        oilPricesOrder={oilPricesOrder}
        onOilPricesOrderChange={handleSaveOilPricesOrder}
        visibleOilPrices={visibleOilPrices}
        onVisibleOilPricesChange={handleSaveVisibleOilPrices}
      />

      <WorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        onWorkspaceChange={loadWorkspaces}
      />

      <Notepad
        isOpen={showNotepad}
        onClose={() => setShowNotepad(false)}
        content={noteContent}
        onSave={handleSaveNote}
        showGoals={showGoalProgressBox}
        contacts={contacts}
        panelOrder={panelOrder}
        showNotepad={showNotepad}
        showPriority={showPriorityPanel}
        notepadExpanded={notepadExpanded}
        goalsExpanded={goalsExpanded}
        priorityExpanded={priorityExpanded}
        onExpandedChange={setNotepadExpanded}
        onRefreshNotes={loadSavedNotes}
        panelSpacing={panelSpacing}
        workspaceId={currentWorkspace?.id}
        onSaveToNotesSection={async (title: string, content: string, contactId?: string) => {
          if (!user) return;
          try {
            const { error } = await supabase
              .from('saved_notes')
              .insert([{
                user_id: user.id,
                workspace_id: currentWorkspace?.id,
                title,
                content,
                contact_id: contactId,
              }]);

            if (error) throw error;
            await loadSavedNotes();
          } catch (error) {
            console.error('Error saving note to notes section:', error);
            throw error;
          }
        }}
      />

      <PriorityPanel
        isOpen={showPriorityPanel}
        onClose={() => setShowPriorityPanel(false)}
        contacts={contacts}
        onContactClick={handleContactClick}
        showGoals={showGoalProgressBox}
        showNotepad={showNotepad}
        panelOrder={panelOrder}
        showPriority={showPriorityPanel}
        notepadExpanded={notepadExpanded}
        goalsExpanded={goalsExpanded}
        priorityExpanded={priorityExpanded}
        onExpandedChange={setPriorityExpanded}
        panelSpacing={panelSpacing}
        customPriorityLabels={customPriorityLabels}
      />
    </div>
  );
}

export default App;
