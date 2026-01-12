import { useState, useEffect } from 'react';
import { Edit2, Trash2, Mail, Phone, MapPin, Package, Ship, Truck, Anchor } from 'lucide-react';
import { SupplierWithOrders, SupplierPort } from '../lib/supabase';

interface SupplierTableViewProps {
  suppliers: SupplierWithOrders[];
  onSupplierClick: (supplier: SupplierWithOrders) => void;
  onDeleteSupplier: (id: string) => void;
  onEditSupplier: (supplier: SupplierWithOrders) => void;
  onEditPort?: (port: SupplierPort) => void;
}

export default function SupplierTableView({
  suppliers,
  onSupplierClick,
  onDeleteSupplier,
  onEditSupplier,
  onEditPort,
}: SupplierTableViewProps) {
  const [columnWidths, setColumnWidths] = useState({
    companyName: 180,
    type: 120,
    contactPerson: 150,
    contactInfo: 200,
    location: 150,
    ports: 200,
    fuelTypes: 200,
    orders: 100,
    lastOrder: 150,
    actions: 100,
  });
  const [resizing, setResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    setResizing(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column as keyof typeof columnWidths]);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [resizing]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, startX, startWidth]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative" style={{ width: columnWidths.companyName }}>
                Company Name
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 transition-colors"
                  onMouseDown={(e) => handleMouseDown(e, 'companyName')}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative" style={{ width: columnWidths.type }}>
                Type
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 transition-colors"
                  onMouseDown={(e) => handleMouseDown(e, 'type')}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative" style={{ width: columnWidths.contactPerson }}>
                Contact Person
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 transition-colors"
                  onMouseDown={(e) => handleMouseDown(e, 'contactPerson')}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative" style={{ width: columnWidths.contactInfo }}>
                Contact Info
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 transition-colors"
                  onMouseDown={(e) => handleMouseDown(e, 'contactInfo')}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative" style={{ width: columnWidths.location }}>
                Location
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 transition-colors"
                  onMouseDown={(e) => handleMouseDown(e, 'location')}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative" style={{ width: columnWidths.ports }}>
                Ports
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 transition-colors"
                  onMouseDown={(e) => handleMouseDown(e, 'ports')}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative" style={{ width: columnWidths.fuelTypes }}>
                Fuel Types
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 transition-colors"
                  onMouseDown={(e) => handleMouseDown(e, 'fuelTypes')}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative" style={{ width: columnWidths.orders }}>
                Orders
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 transition-colors"
                  onMouseDown={(e) => handleMouseDown(e, 'orders')}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative" style={{ width: columnWidths.lastOrder }}>
                Last Order
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 transition-colors"
                  onMouseDown={(e) => handleMouseDown(e, 'lastOrder')}
                />
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: columnWidths.actions }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  No suppliers found
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSupplierClick(supplier)}
                >
                  <td className="px-4 py-3" style={{ width: columnWidths.companyName }}>
                    <div className="text-sm font-medium text-gray-900 truncate">{supplier.company_name}</div>
                  </td>
                  <td className="px-4 py-3" style={{ width: columnWidths.type }}>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-gray-900 truncate">{supplier.supplier_type || '-'}</div>
                      {supplier.business_classification && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs w-fit">
                          {supplier.business_classification}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ width: columnWidths.contactPerson }}>
                    <div className="text-sm text-gray-900 truncate">{supplier.contact_person || '-'}</div>
                  </td>
                  <td className="px-4 py-3" style={{ width: columnWidths.contactInfo }}>
                    <div className="flex flex-col gap-1">
                      {supplier.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{supplier.phone}</span>
                        </div>
                      )}
                      {(supplier.general_email || supplier.email) && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {[supplier.general_email, supplier.email].filter(Boolean).join('; ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ width: columnWidths.location }}>
                    <div className="flex flex-col gap-1 text-sm text-gray-600">
                      {supplier.country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{supplier.country}</span>
                        </div>
                      )}
                      {supplier.regions && supplier.regions.length > 0 && (
                        <div className="flex flex-wrap gap-1 ml-4">
                          {supplier.regions.slice(0, 3).map((region) => (
                            <span
                              key={region.id}
                              className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                            >
                              {region.name}
                            </span>
                          ))}
                          {supplier.regions.length > 3 && (
                            <span className="text-xs text-gray-500">+{supplier.regions.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ width: columnWidths.ports }}>
                    <div className="text-sm text-gray-900">
                      {supplier.ports_detailed && supplier.ports_detailed.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {supplier.ports_detailed.slice(0, 2).map((port) => {
                            const hasBarge = port.has_barge || supplier.default_has_barge;
                            const hasTruck = port.has_truck || supplier.default_has_truck;
                            const hasExpipe = port.has_expipe || supplier.default_has_expipe;
                            return (
                              <div key={port.id} className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onEditPort) {
                                      onEditPort(port);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                  <MapPin className="w-3 h-3" />
                                  {port.port_name}
                                </button>
                                <div className="flex gap-0.5">
                                  {hasBarge && <Ship className="w-3 h-3 text-blue-600" title="Barge" />}
                                  {hasTruck && <Truck className="w-3 h-3 text-green-600" title="Truck" />}
                                  {hasExpipe && <Anchor className="w-3 h-3 text-orange-600" title="Ex-Pipe" />}
                                </div>
                              </div>
                            );
                          })}
                          {supplier.ports_detailed.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{supplier.ports_detailed.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : supplier.ports ? (
                        <div className="flex flex-wrap gap-1">
                          {supplier.ports.split(',').slice(0, 2).map((port, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                              <MapPin className="w-3 h-3" />
                              {port.trim()}
                            </span>
                          ))}
                          {supplier.ports.split(',').length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{supplier.ports.split(',').length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ width: columnWidths.fuelTypes }}>
                    <div className="text-sm text-gray-900">
                      {supplier.fuel_types ? (
                        <div className="flex flex-wrap gap-1">
                          {supplier.fuel_types.split(',').slice(0, 2).map((fuel, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs">
                              <Package className="w-3 h-3" />
                              {fuel.trim()}
                            </span>
                          ))}
                          {supplier.fuel_types.split(',').length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{supplier.fuel_types.split(',').length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ width: columnWidths.orders }}>
                    <div className="text-sm text-gray-900">{supplier.total_orders || 0}</div>
                  </td>
                  <td className="px-4 py-3" style={{ width: columnWidths.lastOrder }}>
                    {supplier.last_order_date ? (
                      <div className="text-sm text-gray-900">
                        {new Date(supplier.last_order_date).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ width: columnWidths.actions }}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditSupplier(supplier);
                        }}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this supplier?')) {
                            onDeleteSupplier(supplier.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
