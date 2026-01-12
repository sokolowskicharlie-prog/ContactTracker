import { X, Building2, User, Mail, Phone, Globe, MapPin, Package, DollarSign, FileText, Star, Anchor, Ship, Truck, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Supplier, supabase } from '../lib/supabase';
import { COUNTRIES, TIMEZONES } from '../lib/timezones';

interface SupplierModalProps {
  supplier?: Supplier;
  onClose: () => void;
  onSave: (supplier: Partial<Supplier>) => void;
}

const SUPPLIER_TYPES = [
  'Supplier',
  'Provisions',
  'Ship Supplies',
  'Spare Parts',
  'Marine Services',
  'Technical Services',
  'Crew Services',
  'Port Services',
  'Logistics',
  'Other',
];

const BUSINESS_CLASSIFICATIONS = [
  'Trader',
  'Supplier',
  'Trader/Supplier',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'JPY', 'CNY', 'AED', 'INR'];

const UK_REGIONS = [
  'Scotland',
  'Wales',
  'Northern Ireland',
  'North East England',
  'North West England',
  'Yorkshire and the Humber',
  'East Midlands',
  'West Midlands',
  'East of England',
  'London',
  'South East England',
  'South West England',
];

interface CustomCountry {
  id: string;
  name: string;
  timezone: string;
  display_order: number;
}

export default function SupplierModal({ supplier, onClose, onSave }: SupplierModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [supplierType, setSupplierType] = useState('');
  const [businessClassification, setBusinessClassification] = useState('');
  const [productsServices, setProductsServices] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [ports, setPorts] = useState('');
  const [fuelTypes, setFuelTypes] = useState('');
  const [generalEmail, setGeneralEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | undefined>();
  const [defaultHasBarge, setDefaultHasBarge] = useState(false);
  const [defaultHasTruck, setDefaultHasTruck] = useState(false);
  const [defaultHasExpipe, setDefaultHasExpipe] = useState(false);
  const [customCountries, setCustomCountries] = useState<CustomCountry[]>([]);
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryTimezone, setNewCountryTimezone] = useState('GMT+0');

  useEffect(() => {
    const fetchCustomCountries = async () => {
      const { data, error } = await supabase
        .from('custom_countries')
        .select('*')
        .order('display_order');

      if (!error && data) {
        setCustomCountries(data);
      }
    };

    fetchCustomCountries();
  }, []);

  useEffect(() => {
    if (supplier) {
      setCompanyName(supplier.company_name || '');
      setContactPerson(supplier.contact_person || '');
      setEmail(supplier.email || '');
      setPhone(supplier.phone || '');
      setWebsite(supplier.website || '');
      setAddress(supplier.address || '');
      setCountry(supplier.country || '');
      setRegion(supplier.region || '');
      setSupplierType(supplier.supplier_type || '');
      setBusinessClassification(supplier.business_classification || '');
      setProductsServices(supplier.products_services || '');
      setPaymentTerms(supplier.payment_terms || '');
      setCurrency(supplier.currency || 'USD');
      setPorts(supplier.ports || '');
      setFuelTypes(supplier.fuel_types || '');
      setGeneralEmail(supplier.general_email || '');
      setNotes(supplier.notes || '');
      setRating(supplier.rating);
      setDefaultHasBarge(supplier.default_has_barge || false);
      setDefaultHasTruck(supplier.default_has_truck || false);
      setDefaultHasExpipe(supplier.default_has_expipe || false);
    }
  }, [supplier]);

  useEffect(() => {
    if (email && !companyName && !supplier?.id) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        const domain = email.split('@')[1];
        const domainWithoutTLD = domain.split('.')[0];
        const suggestedCompany = domainWithoutTLD.charAt(0).toUpperCase() + domainWithoutTLD.slice(1);
        setCompanyName(suggestedCompany);
      }
    }
  }, [email, companyName, supplier]);

  const handleAddCountry = async () => {
    if (!newCountryName.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from('custom_countries')
      .insert({
        user_id: userData.user.id,
        name: newCountryName.trim(),
        timezone: newCountryTimezone,
        display_order: customCountries.length,
      });

    if (!error) {
      const { data } = await supabase
        .from('custom_countries')
        .select('*')
        .order('display_order');

      if (data) {
        setCustomCountries(data);
      }

      setCountry(newCountryName.trim());
      setNewCountryName('');
      setNewCountryTimezone('GMT+0');
      setShowAddCountry(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!companyName.trim()) return;

    onSave({
      ...(supplier?.id ? { id: supplier.id } : {}),
      company_name: companyName.trim(),
      contact_person: contactPerson.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      website: website.trim() || null,
      address: address.trim() || null,
      country: country.trim() || null,
      region: region.trim() || null,
      supplier_type: supplierType || null,
      business_classification: businessClassification || null,
      products_services: productsServices.trim() || null,
      payment_terms: paymentTerms.trim() || null,
      currency: currency || null,
      ports: ports.trim() || null,
      fuel_types: fuelTypes.trim() || null,
      general_email: generalEmail.trim() || null,
      notes: notes.trim() || null,
      rating: rating || null,
      default_has_barge: defaultHasBarge,
      default_has_truck: defaultHasTruck,
      default_has_expipe: defaultHasExpipe,
    });

    onClose();
  };

  const handleClose = () => {
    // If editing an existing supplier and company name is filled, save changes
    if (supplier && companyName.trim()) {
      handleSubmit();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {supplier ? 'Edit Supplier' : 'Add Supplier'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Company name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Primary contact"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com; email2@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={country}
                  onChange={(e) => {
                    const selectedCountry = e.target.value;
                    if (selectedCountry === '__ADD_NEW__') {
                      setShowAddCountry(true);
                    } else {
                      setCountry(selectedCountry);
                      if (selectedCountry !== 'United Kingdom') {
                        setRegion('');
                      }
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  {customCountries.length > 0 && (
                    <optgroup label="Custom Countries">
                      {customCountries.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__ADD_NEW__">+ Add New Country</option>
                </select>
              </div>
            </div>

            {country === 'United Kingdom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region (UK)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Select region</option>
                    {UK_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Type
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={supplierType}
                  onChange={(e) => setSupplierType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select type</option>
                  {SUPPLIER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Classification
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={businessClassification}
                  onChange={(e) => setBusinessClassification(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select classification</option>
                  {BUSINESS_CLASSIFICATIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                General Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={generalEmail}
                  onChange={(e) => setGeneralEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="info@company.com; sales@company.com"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Full address"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ports They Supply
              </label>
              <div className="relative">
                <Anchor className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  value={ports}
                  onChange={(e) => setPorts(e.target.value)}
                  rows={2}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Singapore, Rotterdam, Dubai, Houston"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Types (comma-separated)
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  value={fuelTypes}
                  onChange={(e) => setFuelTypes(e.target.value)}
                  rows={2}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., VLSFO, LSMGO, MGO, HFO"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Transport Types (Assumed for all ports)
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultHasBarge}
                    onChange={(e) => setDefaultHasBarge(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <Ship className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Barge</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultHasTruck}
                    onChange={(e) => setDefaultHasTruck(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <Truck className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Truck</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultHasExpipe}
                    onChange={(e) => setDefaultHasExpipe(e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                  />
                  <Anchor className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-700">Ex-Pipe</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                These transport types will be assumed for all ports unless overridden at the port level.
              </p>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Products / Services
              </label>
              <textarea
                value={productsServices}
                onChange={(e) => setProductsServices(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What products or services does this supplier provide?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Net 30, COD"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Rating
              </label>
              <select
                value={rating || ''}
                onChange={(e) => setRating(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No rating</option>
                <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                <option value="4">⭐⭐⭐⭐ Good</option>
                <option value="3">⭐⭐⭐ Average</option>
                <option value="2">⭐⭐ Poor</option>
                <option value="1">⭐ Very Poor</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
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
              {supplier ? 'Update' : 'Add'} Supplier
            </button>
          </div>
        </form>
      </div>

      {showAddCountry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Country</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country Name
                </label>
                <input
                  type="text"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter country name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={newCountryTimezone}
                  onChange={(e) => setNewCountryTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddCountry(false);
                    setNewCountryName('');
                    setNewCountryTimezone('GMT+0');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCountry}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Country
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
