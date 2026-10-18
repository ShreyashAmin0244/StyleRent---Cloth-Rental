import React from 'react';
import { 
  Package, 
  Calendar, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Copy, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Order } from '../types';
import { formatDate, formatINR } from '../utils/rentalCalculations';

interface OrdersTrackerViewProps {
  orders: Order[];
  onExploreShop: () => void;
}

export const OrdersTrackerView: React.FC<OrdersTrackerViewProps> = ({
  orders,
  onExploreShop,
}) => {
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(
    orders.length > 0 ? orders[0].id : null
  );

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DBD0] pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            My Rental Bookings & Returns
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Track your delivery, scheduled event periods, return pickups, and security deposit refunds.
          </p>
        </div>

        <button
          onClick={onExploreShop}
          className="self-start sm:self-auto px-4 py-2 bg-[#6B1D2F] text-white text-xs font-semibold rounded-xl hover:bg-[#521321] transition-all"
        >
          Rent Another Look
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl font-bold text-stone-800">No active rental orders yet</h3>
          <p className="text-stone-500 text-xs max-w-sm mx-auto">
            Browse our curated ethnic collection of lehengas, sherwanis, and gowns with smart operational calendar availability.
          </p>
          <button
            onClick={onExploreShop}
            className="px-6 py-2.5 rounded-xl bg-[#6B1D2F] text-white text-xs font-bold"
          >
            Start Renting
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div 
                key={order.id} 
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:border-[#6B1D2F]/30 transition-all"
              >
                {/* Summary Header */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/70"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF4EB] border border-[#DFCBB5] text-[#6B1D2F] flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#6B1D2F] text-sm">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-stone-400">•</span>
                        <span className="text-xs text-stone-500">
                          Booked on {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-stone-900 text-base mt-0.5">
                        {order.items.map((i) => i.product.name).join(', ')}
                      </h4>

                      <div className="text-xs text-stone-600 mt-0.5">
                        Delivering to: <strong>{order.customer.city}</strong> • Total Paid: <strong>{formatINR(order.pricing.grandTotal)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-stone-100">
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        order.orderStatus === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.orderStatus === 'Confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>{order.orderStatus}</span>
                      </span>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                        Refundable Deposit: {formatINR(order.pricing.securityDepositTotal)}
                      </div>
                    </div>

                    <button className="text-stone-400 hover:text-stone-700 p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-stone-200 bg-[#FAF7F2]/50 space-y-6">
                    
                    {/* Items List */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Rented Garments
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {order.items.map((item) => (
                          <div key={item.cartItemId} className="bg-white p-3.5 rounded-xl border border-stone-200 flex gap-3 text-xs">
                            <img
                              src={item.product.images[0]}
                              alt=""
                              className="w-16 h-20 object-cover object-top rounded-lg border border-stone-200"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <h5 className="font-bold text-stone-900 truncate">{item.product.name}</h5>
                              <div className="text-stone-600">
                                Size: <strong>{item.selectedSize}</strong>
                                {item.backupSize && <span> (Backup: {item.backupSize})</span>}
                              </div>
                              <div className="text-stone-500 text-[11px]">
                                Event Period: {formatDate(item.startDate)} - {formatDate(item.returnDate)}
                              </div>
                              <div className="text-[#6B1D2F] font-semibold">
                                Rental Fee: {formatINR(item.rentalFee)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Return Logistics Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5">
                        <div className="font-bold text-stone-900 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span>Doorstep Delivery Schedule</span>
                        </div>
                        <p className="text-stone-600">
                          Arrives 1 day before your event in sanitized garment bag.
                        </p>
                        <div className="font-medium text-stone-800">
                          Target Delivery: <strong>{formatDate(order.items[0]?.deliveryDate)}</strong>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5">
                        <div className="font-bold text-stone-900 flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4 text-[#6B1D2F]" />
                          <span>Reusable Return Bag Service</span>
                        </div>
                        <p className="text-stone-600">
                          Return slip is pre-printed. Delivery executive picks up bag the morning after event.
                        </p>
                        <div className="font-mono text-[11px] text-stone-700">
                          Return Waybill: <strong>{order.returnBagTracking}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
                      <div className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                        Live Tracking History
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                        {order.timeline.map((step, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2.5 rounded-xl border ${
                              step.completed 
                                ? 'bg-[#6B1D2F]/10 border-[#6B1D2F]/30 text-[#6B1D2F]' 
                                : 'bg-stone-50 border-stone-200 text-stone-400'
                            }`}
                          >
                            <div className="text-[10px] font-bold uppercase">{step.label}</div>
                            <div className="text-[9px] mt-1">{step.timestamp}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
