import { Building2, Mail, Phone, Star, MapPin, Package, Edit, Trash2 } from 'lucide-react';
import { SupplierWithOrders } from '../lib/supabase';

interface SupplierListProps {
  suppliers: SupplierWithOrders[];
  onSupplierClick: (supplier: SupplierWithOrders) => void;
  onDeleteSupplier: (id: string) => void;
  onEditSupplier: (supplier: SupplierWithOrders) => void;
}

export default function SupplierList({ suppliers, onSupplierClick, onDeleteSupplier, onEditSupplier }: SupplierListProps) {
  const renderRating = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {suppliers.map((supplier) => (
        <div
          key={supplier.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div
            className="p-6 cursor-pointer"
            onClick={() => onSupplierClick(supplier)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  {supplier.company_name}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {supplier.supplier_type && (
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {supplier.supplier_type}
                    </span>
                  )}
                  {supplier.business_classification && (
                    <span className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                      {supplier.business_classification}
                    </span>
                  )}
                </div>
              </div>
              {supplier.rating && (
                <div className="ml-2">{renderRating(supplier.rating)}</div>
              )}
            </div>

            {supplier.contact_person && (
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <span className="font-medium">{supplier.contact_person}</span>
              </p>
            )}

            <div className="space-y-1 mb-3">
              {(supplier.general_email || supplier.email) && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="truncate">
                    {[supplier.general_email, supplier.email].filter(Boolean).join('; ')}
                  </span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {supplier.phone}
                </div>
              )}
              {supplier.country && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {supplier.country}
                </div>
              )}
            </div>

            {supplier.regions && supplier.regions.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {supplier.regions.map((region) => (
                    <span
                      key={region.id}
                      className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                    >
                      {region.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {supplier.products_services && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {supplier.products_services}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-600">
                <Package className="w-4 h-4 mr-1" />
                <span>{supplier.total_orders} orders</span>
              </div>
              {supplier.currency && (
                <span className="text-xs text-gray-500 font-medium">
                  {supplier.currency}
                </span>
              )}
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex gap-2 rounded-b-xl">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditSupplier(supplier);
              }}
              className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${supplier.company_name}?`)) {
                  onDeleteSupplier(supplier.id);
                }
              }}
              className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
