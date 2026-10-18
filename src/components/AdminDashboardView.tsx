import React, { useState } from 'react';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  Camera, 
  RefreshCw, 
  Layers, 
  ClipboardCheck, 
  ShieldCheck, 
  Check, 
  Eye, 
  FileText,
  Lock
} from 'lucide-react';
import { InventoryItem, Order, ReturnInspection } from '../types';
import { formatDate, formatINR } from '../utils/rentalCalculations';

interface AdminDashboardViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: any) => void;
  inventory: InventoryItem[];
  onUpdateInventoryStatus: (itemId: string, newStatus: any) => void;
  inspections: ReturnInspection[];
  onProcessInspection: (inspection: ReturnInspection) => void;
  onLockAccess?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  orders,
  onUpdateOrderStatus,
  inventory,
  onUpdateInventoryStatus,
  inspections,
  onProcessInspection,
  onLockAccess,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'orders' | 'inventory' | 'inspection'>('orders');

  // Inspection form state
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [condition, setCondition] = useState<'good' | 'minor' | 'major'>('good');
  const [damageType, setDamageType] = useState('Minor zipper snag (covered under Peace of Mind Protection)');
  const [damagePhoto, setDamagePhoto] = useState<string | null>(null);
  const [inspectorNotes, setInspectorNotes] = useState('Standard intake check. Dry cleaning initiated.');
  const [inspectionSuccess, setInspectionSuccess] = useState(false);

  // Selected Order for Inspection
  const currentOrderForInspection = orders.find((o) => o.id === selectedOrderId) || orders[0];
  const orderDeposit = currentOrderForInspection?.pricing.securityDepositTotal || 2500;
  const hasDamageProtection = currentOrderForInspection?.pricing.damageProtectionTotal ? true : false;

  // Calculate damage deductions based on condition & protection
  let assessedDamageCharge = 0;
  if (condition === 'minor') {
    assessedDamageCharge = hasDamageProtection ? 0 : 500;
  } else if (condition === 'major') {
    assessedDamageCharge = Math.min(orderDeposit, 2000);
  }
  const calculatedRefund = Math.max(0, orderDeposit - assessedDamageCharge);

  const handleSimulatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fakeUrl = URL.createObjectURL(e.target.files[0]);
      setDamagePhoto(fakeUrl);
    }
  };

  const handleSubmitInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrderForInspection) return;

    const report: ReturnInspection = {
      id: `insp-${Date.now()}`,
      orderId: currentOrderForInspection.id,
      orderNumber: currentOrderForInspection.orderNumber,
      productId: currentOrderForInspection.items[0]?.product.id || 'prod-01',
      productName: currentOrderForInspection.items[0]?.product.name || 'Designer Outfit',
      customerName: currentOrderForInspection.customer.fullName,
      returnCondition: condition,
      damageType: condition === 'good' ? 'None (Pristine Condition)' : damageType,
      damagePhotoUrl: damagePhoto || undefined,
      damageCharge: assessedDamageCharge,
      securityDeposit: orderDeposit,
      refundAmount: calculatedRefund,
      notes: inspectorNotes,
      staffName: 'Pooja Nair (Senior Quality Inspector)',
      inspectedAt: new Date().toISOString(),
      isRefundProcessed: true,
    };

    onProcessInspection(report);
    onUpdateOrderStatus(currentOrderForInspection.id, 'Inspected & Refunded');
    setInspectionSuccess(true);
    setTimeout(() => setInspectionSuccess(false), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#450A18] text-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#E6CA85]/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#E6CA85] text-xs font-semibold uppercase tracking-wider">
            <ClipboardCheck className="w-4 h-4" />
            <span>Staff & Operations Management Console</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1 text-white">
            Style-Rent Admin & Quality Hub
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xl">
            Manage live rental shipments, monitor physical inventory sanitization states, and simulate post-event return damage inspections with automated security deposit refund calculation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {onLockAccess && (
            <button
              onClick={onLockAccess}
              className="px-3.5 py-2 rounded-xl bg-rose-900/90 hover:bg-rose-800 text-rose-100 text-xs font-bold border border-rose-400/50 flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105"
              title="Admin Logout (Locks Admin Dashboard)"
            >
              <Lock className="w-3.5 h-3.5 text-rose-300" />
              <span>Admin Logout (Lock Access)</span>
            </button>
          )}

          {/* Tab switchers */}
          <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex gap-1">
            <button
              onClick={() => setActiveAdminTab('orders')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAdminTab === 'orders' 
                  ? 'bg-[#E6CA85] text-[#450A18] shadow-xs' 
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveAdminTab('inventory')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAdminTab === 'inventory' 
                  ? 'bg-[#E6CA85] text-[#450A18] shadow-xs' 
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Inventory ({inventory.length})
            </button>
            <button
              onClick={() => setActiveAdminTab('inspection')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAdminTab === 'inspection' 
                  ? 'bg-[#E6CA85] text-[#450A18] shadow-xs' 
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Return Inspection Simulator
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: ORDERS MANAGEMENT */}
      {activeAdminTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">Active Rental Orders</h3>
              <p className="text-xs text-stone-500">Update shipping and fulfillment statuses across logistics checkpoints.</p>
            </div>
            <span className="text-xs font-mono font-semibold bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
              {orders.length} Total Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Outfit & Size</th>
                  <th className="py-3 px-4">Event Dates</th>
                  <th className="py-3 px-4">Deposit</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((ord) => {
                  const item = ord.items[0];
                  return (
                    <tr key={ord.id} className="hover:bg-stone-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-[#6B1D2F]">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{ord.customer.fullName}</div>
                        <div className="text-[10px] text-stone-400">{ord.customer.city} • {ord.customer.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-800 truncate max-w-xs">{item?.product.name}</div>
                        <div className="text-[10px] text-stone-500">Size: {item?.selectedSize}</div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {item ? `${formatDate(item.startDate)} - ${formatDate(item.returnDate)}` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-800">
                        {formatINR(ord.pricing.securityDepositTotal)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ord.orderStatus === 'Delivered' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : ord.orderStatus === 'Returned'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold px-2 py-1 rounded-lg border border-stone-300 cursor-pointer focus:outline-hidden"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Preparing">Preparing & Sanitizing</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Returned">Returned (Warehouse)</option>
                          <option value="Inspected & Refunded">Inspected & Refunded</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & GARMENT UNITS */}
      {activeAdminTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">Physical Garment Inventory & Hygiene Tracking</h3>
              <p className="text-xs text-stone-500">Each garment SKU tracks real-time status: Available, Rented, Cleaning, or Maintenance.</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                ● Available
              </span>
              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-semibold border border-blue-200">
                ● Rented
              </span>
              <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md font-semibold border border-amber-200">
                ● In Cleaning
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Garment SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Hub Location</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Quick Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inventory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-stone-700">
                      {inv.sku}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-900">
                      {inv.productName}
                    </td>
                    <td className="py-3 px-4 text-stone-500">
                      {inv.category}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-800">
                      {inv.size}
                    </td>
                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                      {inv.location}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        inv.status === 'Available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'Rented'
                            ? 'bg-blue-100 text-blue-800'
                            : inv.status === 'Cleaning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={inv.status}
                        onChange={(e) => onUpdateInventoryStatus(inv.id, e.target.value)}
                        className="bg-stone-100 text-stone-800 font-semibold px-2 py-1 rounded-lg border border-stone-300 text-[11px]"
                      >
                        <option value="Available">Available</option>
                        <option value="Rented">Rented</option>
                        <option value="Cleaning">Cleaning & QC</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RETURN INSPECTION SIMULATOR (Prompt Requirement #17) */}
      {activeAdminTab === 'inspection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Inspection Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 space-y-5 shadow-xs">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Post-Return Quality Inspection & Deposit Refund
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Inspect returned garment, assess condition, calculate damage deductions, and process automated refund.
              </p>
            </div>

            {inspectionSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-fade-in font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Return inspection completed! Security deposit of {formatINR(calculatedRefund)} was refunded to customer UPI. Garment transitioned to "Cleaning".
                </span>
              </div>
            )}

            <form onSubmit={handleSubmitInspection} className="space-y-4 text-xs">
              
              {/* Select Return Order */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">Select Returned Order for Intake</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-800"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customer.fullName} ({o.items[0]?.product.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Garment Condition Picker */}
              <div>
                <label className="font-bold text-stone-800 block mb-1.5">Inspected Return Condition</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCondition('good')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      condition === 'good'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                    <span>✓ Good Condition</span>
                    <span className="block text-[10px] text-emerald-700 mt-0.5">100% Refund</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCondition('minor')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      condition === 'minor'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold ring-1 ring-amber-500'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                    <span>⚠ Minor Damage</span>
                    <span className="block text-[10px] text-amber-700 mt-0.5">
                      {hasDamageProtection ? 'Protected (₹0)' : '₹500 Fee'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCondition('major')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      condition === 'major'
                        ? 'bg-red-50 border-red-500 text-red-900 font-bold ring-1 ring-red-500'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-600 mx-auto mb-1" />
                    <span>✕ Major Damage</span>
                    <span className="block text-[10px] text-red-700 mt-0.5">Deposit Retained</span>
                  </button>
                </div>
              </div>

              {/* Damage Notes if not good */}
              {condition !== 'good' && (
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Damage Description</label>
                  <input
                    type="text"
                    value={damageType}
                    onChange={(e) => setDamageType(e.target.value)}
                    placeholder="e.g. Small stain on dupatta hemline, loose button"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              )}

              {/* Upload Damage Photo Section */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Upload Return / Damage Photo (Simulated)
                </label>
                <div className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center hover:bg-stone-50 cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSimulatePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Camera className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                  <span className="text-stone-600 font-medium">Click to select photo</span>
                  <span className="text-[10px] text-stone-400 block">PNG, JPG up to 10MB</span>
                </div>

                {damagePhoto && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={damagePhoto} alt="Damage" className="w-12 h-12 rounded-lg object-cover border" />
                    <span className="text-[11px] text-emerald-700 font-medium">Photo attached to inspection file</span>
                  </div>
                )}
              </div>

              {/* Staff Notes */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">Inspector Internal Remarks</label>
                <textarea
                  rows={2}
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-[#450A18] hover:bg-[#340712] text-[#E6CA85] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer border border-[#E6CA85]/30"
              >
                Complete Inspection & Process Refund
              </button>
            </form>
          </div>

          {/* Refund Calculation & Summary Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#FAF7F2] rounded-3xl border border-[#DFCBB5] p-6 space-y-4 text-xs">
              <h4 className="font-serif font-bold text-stone-900 text-base">
                Security Deposit Settlement Breakdown
              </h4>

              <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2.5">
                <div className="flex justify-between text-stone-600">
                  <span>Customer Name:</span>
                  <strong className="text-stone-900">{currentOrderForInspection?.customer.fullName}</strong>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>Order Reference:</span>
                  <span className="font-mono font-bold text-[#6B1D2F]">{currentOrderForInspection?.orderNumber}</span>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>Peace of Mind Protection:</span>
                  <span className={`font-semibold ${hasDamageProtection ? 'text-emerald-700' : 'text-stone-500'}`}>
                    {hasDamageProtection ? 'Active (Covers Minor)' : 'Not Opted'}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between">
                  <span>Held Security Deposit:</span>
                  <span className="font-bold text-stone-900">{formatINR(orderDeposit)}</span>
                </div>

                <div className="flex justify-between text-red-600">
                  <span>Damage Charge Deducted:</span>
                  <span className="font-bold">
                    {assessedDamageCharge === 0 ? '₹0 (Waived)' : `-${formatINR(assessedDamageCharge)}`}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-300 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-stone-900">Refund to Customer UPI:</span>
                  <span className="font-serif text-xl font-bold text-emerald-700">
                    {formatINR(calculatedRefund)}
                  </span>
                </div>
              </div>

              {/* Previous Inspection Logs */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Recent Inspection Logs
                </div>
                {inspections.map((insp) => (
                  <div key={insp.id} className="bg-white p-3 rounded-xl border border-stone-200 text-[11px] space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>{insp.orderNumber} - {insp.customerName}</span>
                      <span className="text-emerald-700">Refunded {formatINR(insp.refundAmount)}</span>
                    </div>
                    <div className="text-stone-500 text-[10px]">
                      Condition: {insp.returnCondition.toUpperCase()} • {insp.staffName}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
