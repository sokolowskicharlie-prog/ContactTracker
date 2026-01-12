import { useState, useEffect } from 'react';
import { X, Upload, Search, Download, AlertCircle, ArrowUpDown, Filter, Plus, Mail, Settings, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ContactWithActivity, Supplier, supabase } from '../lib/supabase';
import ContactModal from './ContactModal';
import SupplierModal from './SupplierModal';
import { useAuth } from '../lib/auth';
import { Workspace } from '../lib/workspaces';

interface BulkSearchModalProps {
  contacts: ContactWithActivity[];
  onClose: () => void;
  onSelectContact: (contact: ContactWithActivity) => void;
  currentWorkspace: Workspace | null;
  onRefresh?: () => void;
}

interface SearchResult {
  searchedName: string;
  found: boolean;
  type?: 'contact' | 'supplier';
  contact?: ContactWithActivity;
  supplier?: Supplier;
  matchedTerm?: string;
  matchedField?: string;
}

type SortType = 'none' | 'found-first' | 'not-found-first' | 'alphabetical' | 'priority';
type SearchType = 'all' | 'email' | 'name' | 'company';

export default function BulkSearchModal({ contacts, onClose, onSelectContact, currentWorkspace, onRefresh }: BulkSearchModalProps) {
  const { user } = useAuth();
  const [searchNames, setSearchNames] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [textInput, setTextInput] = useState('');
  const [sortType, setSortType] = useState<SortType>('none');
  const [searchType, setSearchType] = useState<SearchType>('all');

  const [filterText, setFilterText] = useState('');
  const [filterFoundStatus, setFilterFoundStatus] = useState<'all' | 'found' | 'not-found'>('all');
  const [filterType, setFilterType] = useState<'all' | 'contact' | 'supplier'>('all');
  const [filterContactStatus, setFilterContactStatus] = useState<'all' | 'client' | 'traction' | 'jammed' | 'none'>('all');
  const [excludedMatchedTerms, setExcludedMatchedTerms] = useState<Set<string>>(new Set());

  const [permanentExcludedTerms, setPermanentExcludedTerms] = useState<string[]>([]);
  const [showExclusionSettings, setShowExclusionSettings] = useState(false);
  const [newExcludedTerm, setNewExcludedTerm] = useState('');

  const [showContactModal, setShowContactModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [prefilledCompanyName, setPrefilledCompanyName] = useState('');

  useEffect(() => {
    loadExcludedTerms();
  }, []);

  const loadExcludedTerms = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('excluded_search_terms')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading excluded terms:', error);
        return;
      }

      if (data && data.excluded_search_terms) {
        setPermanentExcludedTerms(data.excluded_search_terms);
      } else {
        setPermanentExcludedTerms([]);
      }
    } catch (error) {
      console.error('Error loading excluded terms:', error);
    }
  };

  const saveExcludedTerms = async (terms: string[]): Promise<boolean> => {
    if (!user) {
      alert('User not logged in. Please refresh the page.');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          excluded_search_terms: terms,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving excluded terms:', error);
        alert(`Failed to save excluded terms: ${error.message}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error saving excluded terms:', error);
      alert('Failed to save excluded terms. Please try again.');
      return false;
    }
  };

  const addPermanentExcludedTerm = async () => {
    if (!newExcludedTerm.trim()) return;

    const term = newExcludedTerm.trim().toLowerCase();
    if (permanentExcludedTerms.includes(term)) {
      alert('This term is already in the exclusion list');
      return;
    }

    const newTerms = [...permanentExcludedTerms, term];
    const success = await saveExcludedTerms(newTerms);
    if (success) {
      setPermanentExcludedTerms(newTerms);
      setNewExcludedTerm('');
    }
  };

  const removePermanentExcludedTerm = async (term: string) => {
    const newTerms = permanentExcludedTerms.filter(t => t !== term);
    const success = await saveExcludedTerms(newTerms);
    if (success) {
      setPermanentExcludedTerms(newTerms);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        const names: string[] = [];
        jsonData.forEach(row => {
          if (row[0] && typeof row[0] === 'string' && row[0].trim()) {
            names.push(row[0].trim());
          }
        });

        setSearchNames(names);
        performSearch(names);
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please make sure it\'s a valid Excel file.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleTextSearch = () => {
    const names = textInput
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    setSearchNames(names);
    performSearch(names);
  };

  // Generic words to exclude from search
  const EXCLUDED_WORDS = new Set([
    'carriers', 'marine', 'holding', 'shipping', 'maritime', 'logistics',
    'transport', 'services', 'international', 'global', 'trading', 'company',
    'corporation', 'limited', 'group', 'agency', 'agencies', 'solutions',
    'enterprises', 'industries', 'oil', 'gas', 'energy', 'bunker', 'fuel',
    'supply', 'petroleum', 'ltd', 'inc', 'corp', 'llc', 'gmbh', 'sa', 'co'
  ]);

  const performSearch = async (names: string[]) => {
    const results: SearchResult[] = [];

    for (const searchedName of names) {
      const searchTerm = searchedName.toLowerCase().trim();

      // Skip empty search terms
      if (!searchTerm) {
        results.push({
          searchedName,
          found: false
        });
        continue;
      }

      // Check if it's an email domain search (e.g., @company.com)
      let isEmailDomain = searchTerm.startsWith('@');
      let domainToSearch = searchTerm;

      // If it's a full email address, extract the domain
      if (!isEmailDomain && searchTerm.includes('@')) {
        const atIndex = searchTerm.indexOf('@');
        domainToSearch = searchTerm.substring(atIndex); // e.g., "ukbrokers@wfscorp.com" -> "@wfscorp.com"
        isEmailDomain = true;
      }

      // If searching by domain, find ALL matches
      if (isEmailDomain) {
        const allContactMatches = contacts.filter(contact => {
          const contactEmail = contact.email?.toLowerCase() || '';
          return contactEmail.includes(domainToSearch);
        });

        // Search in suppliers for domain matches
        let supplierMatches: any[] = [];
        try {
          const { data: suppliers } = await supabase
            .from('suppliers')
            .select('*')
            .or(`email.ilike.%${domainToSearch}%,general_email.ilike.%${domainToSearch}%`);

          supplierMatches = suppliers || [];
        } catch (error) {
          console.error('Error searching suppliers:', error);
        }

        // Add all contact matches as separate results
        allContactMatches.forEach(contact => {
          results.push({
            searchedName: searchedName,
            found: true,
            type: 'contact',
            contact: contact
          });
        });

        // Add all supplier matches as separate results
        supplierMatches.forEach(supplier => {
          results.push({
            searchedName: searchedName,
            found: true,
            type: 'supplier',
            supplier: supplier
          });
        });

        // If no matches found at all
        if (allContactMatches.length === 0 && supplierMatches.length === 0) {
          results.push({
            searchedName,
            found: false
          });
        }

        continue;
      }

      // Non-domain search: Search in contacts first with whole word matching
      let foundContact: ContactWithActivity | undefined;
      let matchedTerm = '';
      let matchedField = '';

      for (const contact of contacts) {
        const contactName = contact.name?.toLowerCase() || '';
        const contactEmail = contact.email?.toLowerCase() || '';
        const contactCompany = contact.company?.toLowerCase() || '';

        // Split search term into individual words and filter out excluded generic words
        const searchWords = searchTerm
          .split(/\s+/)
          .filter(w => w.length > 0 && !EXCLUDED_WORDS.has(w) && !permanentExcludedTerms.includes(w));

        // If all words were excluded, skip this search
        if (searchWords.length === 0) {
          continue;
        }

        // Helper function to check if any whole word in the field matches the search word exactly
        const matchesWholeWord = (field: string, searchWord: string) => {
          if (!field) return false;
          // Split field into words using common separators
          const fieldWords = field.split(/[\s\-_.@,;]+/).map(w => w.toLowerCase());
          // Check if any word exactly matches the search word
          return fieldWords.some(fw => fw === searchWord);
        };

        // Check if ANY of the search words match whole words in any field
        let found = false;
        for (const searchWord of searchWords) {
          if ((searchType === 'all' || searchType === 'name') && matchesWholeWord(contactName, searchWord)) {
            foundContact = contact;
            matchedTerm = searchWord;
            matchedField = 'Name';
            found = true;
            break;
          }
          if ((searchType === 'all' || searchType === 'email') && matchesWholeWord(contactEmail, searchWord)) {
            foundContact = contact;
            matchedTerm = searchWord;
            matchedField = 'Email';
            found = true;
            break;
          }
          if ((searchType === 'all' || searchType === 'company') && matchesWholeWord(contactCompany, searchWord)) {
            foundContact = contact;
            matchedTerm = searchWord;
            matchedField = 'Company';
            found = true;
            break;
          }
        }

        if (found) break;
      }

      if (foundContact) {
        results.push({
          searchedName,
          found: true,
          type: 'contact',
          contact: foundContact,
          matchedTerm,
          matchedField
        });
        continue;
      }

      // If not found in contacts, search in suppliers with whole word matching
      try {
        // Split search term into words and filter out excluded generic words
        const searchWords = searchTerm
          .split(/\s+/)
          .filter(w => w.length > 0 && !EXCLUDED_WORDS.has(w) && !permanentExcludedTerms.includes(w));

        // If all words were excluded, skip this search
        if (searchWords.length > 0) {
          let candidateSuppliers: any[] = [];

          // Helper function to check if any whole word in the field matches the search word exactly
          const matchesWholeWord = (field: string, searchWord: string) => {
            if (!field) return false;
            const lowerField = field.toLowerCase();
            // Split field into words using common separators
            const fieldWords = lowerField.split(/[\s\-_.@,;]+/);
            // Check if any word exactly matches the search word
            return fieldWords.some(fw => fw === searchWord);
          };

          // Fetch potential matches from database (cast a wide net for efficiency)
          for (const searchWord of searchWords) {
            // Build search conditions based on search type
            const conditions: string[] = [];
            if (searchType === 'all' || searchType === 'company') {
              conditions.push(`company_name.ilike.%${searchWord}%`);
            }
            if (searchType === 'all' || searchType === 'name') {
              conditions.push(`contact_person.ilike.%${searchWord}%`);
            }
            if (searchType === 'all' || searchType === 'email') {
              conditions.push(`email.ilike.%${searchWord}%`);
              conditions.push(`general_email.ilike.%${searchWord}%`);
            }

            if (conditions.length === 0) continue;

            const { data } = await supabase
              .from('suppliers')
              .select('*')
              .or(conditions.join(','));

            if (data && data.length > 0) {
              // Add unique suppliers (avoid duplicates)
              data.forEach(supplier => {
                if (!candidateSuppliers.find(s => s.id === supplier.id)) {
                  candidateSuppliers.push(supplier);
                }
              });
            }
          }

          // Find matching supplier and track which term/field matched
          let foundSupplier: any = null;
          let supplierMatchedTerm = '';
          let supplierMatchedField = '';

          for (const supplier of candidateSuppliers) {
            const companyName = supplier.company_name?.toLowerCase() || '';
            const contactPerson = supplier.contact_person?.toLowerCase() || '';
            const email = supplier.email?.toLowerCase() || '';
            const generalEmail = supplier.general_email?.toLowerCase() || '';

            let found = false;
            for (const searchWord of searchWords) {
              if ((searchType === 'all' || searchType === 'company') && matchesWholeWord(companyName, searchWord)) {
                foundSupplier = supplier;
                supplierMatchedTerm = searchWord;
                supplierMatchedField = 'Company Name';
                found = true;
                break;
              }
              if ((searchType === 'all' || searchType === 'name') && matchesWholeWord(contactPerson, searchWord)) {
                foundSupplier = supplier;
                supplierMatchedTerm = searchWord;
                supplierMatchedField = 'Contact Person';
                found = true;
                break;
              }
              if ((searchType === 'all' || searchType === 'email') && matchesWholeWord(email, searchWord)) {
                foundSupplier = supplier;
                supplierMatchedTerm = searchWord;
                supplierMatchedField = 'Email';
                found = true;
                break;
              }
              if ((searchType === 'all' || searchType === 'email') && matchesWholeWord(generalEmail, searchWord)) {
                foundSupplier = supplier;
                supplierMatchedTerm = searchWord;
                supplierMatchedField = 'General Email';
                found = true;
                break;
              }
            }

            if (found) break;
          }

          if (foundSupplier) {
            results.push({
              searchedName,
              found: true,
              type: 'supplier',
              supplier: foundSupplier,
              matchedTerm: supplierMatchedTerm,
              matchedField: supplierMatchedField
            });
            continue;
          }
        }
      } catch (error) {
        console.error('Error searching suppliers:', error);
      }

      // Not found in either database
      results.push({
        searchedName,
        found: false
      });
    }

    setSearchResults(results);
  };

  const exportResults = () => {
    const exportData = searchResults.map(result => {
      const getContactStatus = () => {
        if (!result.contact) return '';
        const statuses = [];
        if (result.contact.is_client) statuses.push('Client');
        if (result.contact.has_traction) statuses.push('Traction');
        if (result.contact.is_jammed) statuses.push('Jammed');
        return statuses.length > 0 ? statuses.join(', ') : 'None';
      };

      if (result.type === 'supplier' && result.supplier) {
        return {
          'Searched Name': result.searchedName,
          'Status': result.found ? 'Found' : 'Not Found',
          'Type': 'Supplier',
          'Matched Term': result.matchedTerm || '',
          'Matched Field': result.matchedField || '',
          'Company Name': result.supplier.company_name || '',
          'Contact Person': result.supplier.contact_person || '',
          'Country': result.supplier.country || '',
          'Email': result.supplier.email || '',
          'General Email': result.supplier.general_email || '',
          'Phone': result.supplier.phone || '',
          'Supplier Type': result.supplier.supplier_type || '',
          'Contact Status': '',
          'Priority Rank': ''
        };
      }

      return {
        'Searched Name': result.searchedName,
        'Status': result.found ? 'Found' : 'Not Found',
        'Type': result.type === 'contact' ? 'Contact' : '',
        'Matched Term': result.matchedTerm || '',
        'Matched Field': result.matchedField || '',
        'Company Name': result.contact?.company || '',
        'Contact Person': result.contact?.name || '',
        'Country': result.contact?.country || '',
        'Email': result.contact?.email || '',
        'General Email': '',
        'Phone': result.contact?.phone || '',
        'Supplier Type': '',
        'Contact Status': getContactStatus(),
        'Priority Rank': result.contact?.priority_rank || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Search Results');
    XLSX.writeFile(wb, `bulk_search_results_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const foundCount = searchResults.filter(r => r.found).length;
  const notFoundCount = searchResults.length - foundCount;

  const getFilteredAndSortedResults = () => {
    let filtered = [...searchResults];

    if (filterText.trim()) {
      const searchTerm = filterText.toLowerCase().trim();
      filtered = filtered.filter(result => {
        const searchedName = result.searchedName?.toLowerCase() || '';
        const name = result.contact?.name?.toLowerCase() || '';
        const email = result.contact?.email?.toLowerCase() || '';
        const company = result.contact?.company?.toLowerCase() || '';
        const supplierName = result.supplier?.company_name?.toLowerCase() || '';
        const supplierEmail = result.supplier?.email?.toLowerCase() || '';
        const supplierGeneralEmail = result.supplier?.general_email?.toLowerCase() || '';
        const country = result.contact?.country?.toLowerCase() || result.supplier?.country?.toLowerCase() || '';

        return (
          searchedName.includes(searchTerm) ||
          name.includes(searchTerm) ||
          email.includes(searchTerm) ||
          company.includes(searchTerm) ||
          supplierName.includes(searchTerm) ||
          supplierEmail.includes(searchTerm) ||
          supplierGeneralEmail.includes(searchTerm) ||
          country.includes(searchTerm)
        );
      });
    }

    if (filterFoundStatus !== 'all') {
      filtered = filtered.filter(result => {
        if (filterFoundStatus === 'found') return result.found;
        if (filterFoundStatus === 'not-found') return !result.found;
        return true;
      });
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(result => {
        if (filterType === 'contact') return result.type === 'contact';
        if (filterType === 'supplier') return result.type === 'supplier';
        return true;
      });
    }

    if (filterContactStatus !== 'all') {
      filtered = filtered.filter(result => {
        if (!result.contact) return false;
        if (filterContactStatus === 'client') return result.contact.is_client;
        if (filterContactStatus === 'traction') return result.contact.has_traction;
        if (filterContactStatus === 'jammed') return result.contact.is_jammed;
        if (filterContactStatus === 'none') {
          return !result.contact.is_client && !result.contact.has_traction && !result.contact.is_jammed;
        }
        return true;
      });
    }

    if (excludedMatchedTerms.size > 0) {
      filtered = filtered.filter(result => {
        if (!result.matchedTerm) return true;
        return !excludedMatchedTerms.has(result.matchedTerm.toLowerCase());
      });
    }

    if (sortType === 'none') {
      return filtered;
    }

    if (sortType === 'found-first') {
      return filtered.sort((a, b) => (b.found ? 1 : 0) - (a.found ? 1 : 0));
    } else if (sortType === 'not-found-first') {
      return filtered.sort((a, b) => (a.found ? 1 : 0) - (b.found ? 1 : 0));
    } else if (sortType === 'alphabetical') {
      return filtered.sort((a, b) => {
        const nameA = a.contact?.name || a.contact?.email || a.supplier?.company_name || a.searchedName;
        const nameB = b.contact?.name || b.contact?.email || b.supplier?.company_name || b.searchedName;
        return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
      });
    } else if (sortType === 'priority') {
      return filtered.sort((a, b) => {
        const getPriorityValue = (result: SearchResult) => {
          if (!result.contact) return 4;
          if (result.contact.is_jammed) return 1;
          if (result.contact.is_client) return 2;
          if (!result.contact.is_client && !result.contact.has_traction && !result.contact.is_jammed) return 3;
          if (result.contact.has_traction) return 4;
          return 5;
        };

        return getPriorityValue(a) - getPriorityValue(b);
      });
    }

    return filtered;
  };

  const getUniqueMatchedTerms = (): Array<{ term: string; count: number; field: string }> => {
    const termCounts = new Map<string, { count: number; fields: Set<string> }>();

    searchResults.forEach(result => {
      if (result.matchedTerm && result.matchedField) {
        const lowerTerm = result.matchedTerm.toLowerCase();
        const existing = termCounts.get(lowerTerm);
        if (existing) {
          existing.count++;
          existing.fields.add(result.matchedField);
        } else {
          termCounts.set(lowerTerm, { count: 1, fields: new Set([result.matchedField]) });
        }
      }
    });

    return Array.from(termCounts.entries())
      .map(([term, data]) => ({
        term,
        count: data.count,
        field: Array.from(data.fields).join(', ')
      }))
      .sort((a, b) => b.count - a.count);
  };

  const toggleExcludedTerm = (term: string) => {
    const lowerTerm = term.toLowerCase();
    const newExcluded = new Set(excludedMatchedTerms);
    if (newExcluded.has(lowerTerm)) {
      newExcluded.delete(lowerTerm);
    } else {
      newExcluded.add(lowerTerm);
    }
    setExcludedMatchedTerms(newExcluded);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const extractCompanyNameFromEmail = (email: string): string => {
    if (!isValidEmail(email)) return '';
    const domain = email.split('@')[1];
    const domainWithoutTLD = domain.split('.')[0];
    return domainWithoutTLD.charAt(0).toUpperCase() + domainWithoutTLD.slice(1);
  };

  const handleAddEmailToContact = async (result: SearchResult) => {
    if (!result.contact) return;

    const searchedText = result.searchedName.toLowerCase().trim();
    if (!isValidEmail(searchedText)) {
      alert('The searched text is not a valid email address');
      return;
    }

    const existingEmail = result.contact.email?.trim() || '';
    const existingEmails = existingEmail ? existingEmail.split(/[,;]/).map(e => e.toLowerCase().trim()) : [];

    if (existingEmails.includes(searchedText)) {
      alert('This email is already associated with the contact');
      return;
    }

    const newEmail = existingEmail ? `${existingEmail}; ${searchedText}` : searchedText;

    const confirmAdd = confirm(`Add email "${searchedText}" to contact "${result.contact.name}"?`);
    if (!confirmAdd) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ email: newEmail })
        .eq('id', result.contact.id);

      if (error) throw error;

      alert('Email added successfully');

      result.contact.email = newEmail;
      setSearchResults([...searchResults]);
    } catch (error) {
      console.error('Error adding email:', error);
      alert('Failed to add email to contact');
    }
  };

  const handleCreateNewContact = (result: SearchResult) => {
    const searchedText = result.searchedName.trim();
    const isEmail = isValidEmail(searchedText);
    const extractedName = isEmail ? extractCompanyNameFromEmail(searchedText) : searchedText.toUpperCase();
    setPrefilledEmail(isEmail ? searchedText : '');
    setPrefilledCompanyName(extractedName);
    setSelectedResult(result);
    setShowContactModal(true);
  };

  const handleCreateNewSupplier = (result: SearchResult) => {
    const searchedText = result.searchedName.trim();
    const isEmail = isValidEmail(searchedText);
    const extractedName = isEmail ? extractCompanyNameFromEmail(searchedText) : searchedText.toUpperCase();
    setPrefilledEmail(isEmail ? searchedText : '');
    setPrefilledCompanyName(extractedName);
    setSelectedResult(result);
    setShowSupplierModal(true);
  };

  const handleContactSave = async (contact: Partial<ContactWithActivity>, contactPersons: any[]) => {
    if (!user) {
      alert('You must be logged in to create a contact');
      return;
    }

    try {
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert([{ ...contact, user_id: user.id, workspace_id: currentWorkspace?.id }])
        .select()
        .single();

      if (error) throw error;

      if (contactPersons && contactPersons.length > 0) {
        const personsWithContactId = contactPersons.map(person => ({
          ...person,
          contact_id: newContact.id,
          user_id: user.id
        }));

        const { error: personsError } = await supabase
          .from('contact_persons')
          .insert(personsWithContactId);

        if (personsError) throw personsError;
      }

      alert('Contact created successfully');
      setShowContactModal(false);

      if (selectedResult) {
        selectedResult.found = true;
        selectedResult.type = 'contact';
        selectedResult.contact = newContact as ContactWithActivity;
        setSearchResults([...searchResults]);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact');
    }
  };

  const handleSupplierSave = async (supplier: Partial<Supplier>) => {
    if (!user) {
      alert('You must be logged in to create a supplier');
      return;
    }

    try {
      const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert([{ ...supplier, user_id: user.id, workspace_id: currentWorkspace?.id }])
        .select()
        .single();

      if (error) throw error;

      alert('Supplier created successfully');
      setShowSupplierModal(false);

      if (selectedResult) {
        selectedResult.found = true;
        selectedResult.type = 'supplier';
        selectedResult.supplier = newSupplier;
        setSearchResults([...searchResults]);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert('Failed to create supplier');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Bulk Search</h2>
              <p className="text-blue-100 text-sm">Search contacts and suppliers at once</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {searchResults.length === 0 ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">How to use:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Upload an Excel file with names or emails in the first column</li>
                      <li>Or paste names/emails (one per line) in the text area below</li>
                      <li>Choose search type: All Fields, Email Only, Name Only, or Company Only</li>
                      <li>Searches both Contacts and Suppliers databases</li>
                      <li>Matches whole words only: "john" matches "John Smith" but NOT "Johnson" or "St. Johns"</li>
                      <li>Generic words are automatically excluded: carriers, marine, holding, shipping, oil, gas, etc.</li>
                      <li>Multi-word searches find contacts where ANY word matches exactly</li>
                      <li>When you enter a full email (e.g., ukbrokers@wfscorp.com), it automatically extracts and searches for ALL contacts and suppliers with that domain (@wfscorp.com)</li>
                      <li>Each matching contact or supplier is shown as a separate result</li>
                      <li>Export results to Excel when done</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Search Type
                  </label>
                  <button
                    onClick={() => setShowExclusionSettings(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Exclusion Settings
                    {permanentExcludedTerms.length > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {permanentExcludedTerms.length}
                      </span>
                    )}
                  </button>
                </div>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as SearchType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Fields (Name, Email, Company)</option>
                  <option value="email">Email Only</option>
                  <option value="name">Name Only</option>
                  <option value="company">Company Only</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {searchType === 'all' && 'Search across all fields including name, email, and company'}
                  {searchType === 'email' && 'Search only in email addresses'}
                  {searchType === 'name' && 'Search only in contact/person names'}
                  {searchType === 'company' && 'Search only in company names'}
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-semibold">
                    Upload Excel File
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Excel, CSV files accepted
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-gray-500 text-sm">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Names or Emails (one per line)
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="John Smith&#10;jane.doe@example.com&#10;Company ABC&#10;john@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={8}
                />
                <button
                  onClick={handleTextSearch}
                  disabled={!textInput.trim()}
                  className="mt-3 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-sm text-gray-600">Total Searched:</span>
                    <span className="ml-2 font-bold text-gray-900">{searchResults.length}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Found:</span>
                    <span className="ml-2 font-bold text-green-600">{foundCount}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Not Found:</span>
                    <span className="ml-2 font-bold text-red-600">{notFoundCount}</span>
                  </div>
                  <div className="border-l border-gray-300 pl-6 flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-600" />
                    <select
                      value={sortType}
                      onChange={(e) => setSortType(e.target.value as SortType)}
                      className="text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
                    >
                      <option value="none">Sort: None</option>
                      <option value="found-first">Sort: Found First</option>
                      <option value="not-found-first">Sort: Not Found First</option>
                      <option value="alphabetical">Sort: A-Z (by Match Name)</option>
                      <option value="priority">Sort: Priority Status</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportResults}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Results
                  </button>
                  <button
                    onClick={() => {
                      setSearchResults([]);
                      setSearchNames([]);
                      setTextInput('');
                      setSortType('none');
                      setSearchType('all');
                      setFilterText('');
                      setFilterFoundStatus('all');
                      setFilterType('all');
                      setFilterContactStatus('all');
                      setExcludedMatchedTerms(new Set());
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    New Search
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Filter Results</h3>
                  <button
                    onClick={() => setShowExclusionSettings(true)}
                    className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Exclusion Settings
                    {permanentExcludedTerms.length > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {permanentExcludedTerms.length}
                      </span>
                    )}
                  </button>
                  <span className="text-sm text-gray-600">
                    Showing: {getFilteredAndSortedResults().length} / {searchResults.length}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Search Text
                    </label>
                    <input
                      type="text"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Search by name, email, company, country..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Found Status
                      </label>
                      <select
                        value={filterFoundStatus}
                        onChange={(e) => setFilterFoundStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All</option>
                        <option value="found">Found</option>
                        <option value="not-found">Not Found</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Type
                      </label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All</option>
                        <option value="contact">Contact</option>
                        <option value="supplier">Supplier</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Contact Status
                      </label>
                      <select
                        value={filterContactStatus}
                        onChange={(e) => setFilterContactStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All</option>
                        <option value="jammed">Jammed</option>
                        <option value="client">Client</option>
                        <option value="none">None</option>
                        <option value="traction">Traction</option>
                      </select>
                    </div>
                  </div>

                  {(filterText || filterFoundStatus !== 'all' || filterType !== 'all' || filterContactStatus !== 'all' || excludedMatchedTerms.size > 0) && (
                    <button
                      onClick={() => {
                        setFilterText('');
                        setFilterFoundStatus('all');
                        setFilterType('all');
                        setFilterContactStatus('all');
                        setExcludedMatchedTerms(new Set());
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>

              {getUniqueMatchedTerms().length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-amber-600" />
                    <h3 className="font-semibold text-amber-900">Matched Terms ({getUniqueMatchedTerms().length})</h3>
                    <span className="ml-auto text-xs text-amber-700">
                      Click to exclude from results
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getUniqueMatchedTerms().map(({ term, count, field }) => {
                      const isExcluded = excludedMatchedTerms.has(term.toLowerCase());
                      const isPermanentlyExcluded = permanentExcludedTerms.includes(term.toLowerCase());
                      return (
                        <button
                          key={term}
                          onClick={() => toggleExcludedTerm(term)}
                          disabled={isPermanentlyExcluded}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            isPermanentlyExcluded
                              ? 'bg-gray-200 text-gray-500 border-2 border-gray-300 line-through cursor-not-allowed'
                              : isExcluded
                              ? 'bg-red-100 text-red-800 border-2 border-red-300 line-through opacity-60'
                              : 'bg-white text-amber-800 border-2 border-amber-300 hover:bg-amber-100'
                          }`}
                          title={isPermanentlyExcluded ? `Permanently excluded in settings. Found in: ${field}` : `Found in: ${field}`}
                        >
                          {term} ({count})
                          {isPermanentlyExcluded && <span className="ml-1">🔒</span>}
                        </button>
                      );
                    })}
                  </div>
                  {(excludedMatchedTerms.size > 0 || permanentExcludedTerms.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-amber-200">
                      <p className="text-xs text-amber-700">
                        {excludedMatchedTerms.size > 0 && (
                          <span><strong>{excludedMatchedTerms.size}</strong> term(s) temporarily excluded. </span>
                        )}
                        {permanentExcludedTerms.length > 0 && (
                          <span><strong>{permanentExcludedTerms.length}</strong> term(s) permanently excluded (🔒). </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {getFilteredAndSortedResults().map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      result.found
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm text-gray-600 font-medium">Searched:</span>
                            <span className="font-semibold text-gray-900">
                              {result.searchedName}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                result.found
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-red-200 text-red-800'
                              }`}
                            >
                              {result.found ? 'Found' : 'Not Found'}
                            </span>
                            {result.type && (
                              <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                                {result.type === 'contact' ? 'Contact' : 'Supplier'}
                              </span>
                            )}
                            {result.matchedTerm && result.matchedField && (() => {
                              const termLower = result.matchedTerm!.toLowerCase();
                              const isExcluded = excludedMatchedTerms.has(termLower);
                              const isPermanentlyExcluded = permanentExcludedTerms.some(t => t.toLowerCase() === termLower);

                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExcludedTerm(result.matchedTerm!);
                                  }}
                                  className={`text-xs px-2 py-1 rounded-full font-medium border transition-colors cursor-pointer ${
                                    isPermanentlyExcluded
                                      ? 'bg-gray-400 text-white border-gray-500 cursor-not-allowed'
                                      : isExcluded
                                      ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                                      : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 hover:border-amber-400'
                                  }`}
                                  title={
                                    isPermanentlyExcluded
                                      ? 'Permanently excluded (manage in settings)'
                                      : isExcluded
                                      ? 'Click to include this term'
                                      : 'Click to exclude this term from results'
                                  }
                                  disabled={isPermanentlyExcluded}
                                >
                                  {isExcluded || isPermanentlyExcluded ? '✕ ' : ''}Matched: "{result.matchedTerm}" in {result.matchedField}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                        {result.contact && (
                          <div className="text-sm text-gray-700 space-y-1">
                            <div className="bg-blue-50 p-2 rounded border border-blue-200 mb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-blue-700 uppercase">Found Match:</span>
                              </div>
                              <div className="font-semibold text-gray-900">
                                {result.contact.name}
                                {result.contact.email && (
                                  <span className="ml-2 text-blue-600">
                                    ({result.contact.email})
                                  </span>
                                )}
                              </div>
                            </div>
                            {result.contact.company && (
                              <div>
                                <span className="font-medium">Company:</span>{' '}
                                {result.contact.company}
                              </div>
                            )}
                            {result.contact.country && (
                              <div>
                                <span className="font-medium">Country:</span>{' '}
                                {result.contact.country}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {result.contact.is_client && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                  Client
                                </span>
                              )}
                              {result.contact.has_traction && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                  Traction
                                </span>
                              )}
                              {result.contact.is_jammed && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                  Jammed
                                </span>
                              )}
                              {result.contact.priority_rank && result.contact.priority_rank > 0 && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                                  Priority: {result.contact.priority_rank}
                                </span>
                              )}
                              {!result.contact.is_client && !result.contact.has_traction && !result.contact.is_jammed && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                  None
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {result.supplier && (
                          <div className="text-sm text-gray-700 space-y-1">
                            <div className="bg-gray-50 p-2 rounded border border-gray-200 mb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-700 uppercase">Found Match:</span>
                              </div>
                              <div className="font-semibold text-gray-900">
                                {result.supplier.company_name}
                                {(result.supplier.email || result.supplier.general_email) && (
                                  <span className="ml-2 text-gray-600">
                                    ({result.supplier.email || result.supplier.general_email})
                                  </span>
                                )}
                              </div>
                            </div>
                            {result.supplier.contact_person && (
                              <div>
                                <span className="font-medium">Contact Person:</span>{' '}
                                {result.supplier.contact_person}
                              </div>
                            )}
                            {result.supplier.country && (
                              <div>
                                <span className="font-medium">Country:</span>{' '}
                                {result.supplier.country}
                              </div>
                            )}
                            {result.supplier.supplier_type && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                                  {result.supplier.supplier_type}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        {result.contact && (
                          <>
                            <button
                              onClick={() => {
                                onSelectContact(result.contact!);
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                            >
                              View Contact
                            </button>
                            {isValidEmail(result.searchedName) &&
                             result.contact.email?.toLowerCase() !== result.searchedName.toLowerCase() && (
                              <button
                                onClick={() => handleAddEmailToContact(result)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                Add Email
                              </button>
                            )}
                          </>
                        )}
                        {result.supplier && (
                          <button
                            onClick={() => {
                              alert('Supplier details can be viewed in the Suppliers tab');
                            }}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm whitespace-nowrap"
                          >
                            View Supplier
                          </button>
                        )}
                        {!result.found && (
                          <>
                            <button
                              onClick={() => handleCreateNewContact(result)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              New Contact
                            </button>
                            <button
                              onClick={() => handleCreateNewSupplier(result)}
                              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              New Supplier
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showContactModal && (
        <ContactModal
          contact={prefilledCompanyName ? { email: prefilledEmail, company: prefilledCompanyName, name: prefilledCompanyName } as any : undefined}
          onClose={() => {
            setShowContactModal(false);
            setSelectedResult(null);
            setPrefilledEmail('');
            setPrefilledCompanyName('');
          }}
          onSave={handleContactSave}
        />
      )}

      {showSupplierModal && (
        <SupplierModal
          supplier={prefilledCompanyName ? { email: prefilledEmail, company_name: prefilledCompanyName, contact_person: prefilledCompanyName } as any : undefined}
          onClose={() => {
            setShowSupplierModal(false);
            setSelectedResult(null);
            setPrefilledEmail('');
            setPrefilledCompanyName('');
          }}
          onSave={handleSupplierSave}
        />
      )}

      {showExclusionSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">Search Exclusion Settings</h2>
                  <p className="text-gray-300 text-sm">Permanently exclude specific terms from all searches</p>
                </div>
              </div>
              <button
                onClick={() => setShowExclusionSettings(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">About Exclusion Settings:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Terms added here will be permanently excluded from all bulk search results</li>
                      <li>If a result matches an excluded term, it will not appear in your search results</li>
                      <li>This is useful for filtering out generic or irrelevant terms</li>
                      <li>Terms are case-insensitive (e.g., "Marine" = "marine")</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add New Excluded Term
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newExcludedTerm}
                    onChange={(e) => setNewExcludedTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addPermanentExcludedTerm();
                      }
                    }}
                    placeholder="Enter a term to exclude..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addPermanentExcludedTerm}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Excluded Terms ({permanentExcludedTerms.length})
                </h3>
                {permanentExcludedTerms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Filter className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No excluded terms yet</p>
                    <p className="text-sm">Add terms above to exclude them from searches</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {permanentExcludedTerms.map((term) => (
                      <div
                        key={term}
                        className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3"
                      >
                        <span className="font-medium text-gray-800">{term}</span>
                        <button
                          onClick={() => removePermanentExcludedTerm(term)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition-colors"
                          title="Remove exclusion"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowExclusionSettings(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
