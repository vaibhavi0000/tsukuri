import React, { useState } from 'react';
import { Plus, Trash2, Activity, Filter, RefreshCw, Eye, ShoppingBag, Package, Printer } from 'lucide-react';
import { FirestoreActivity, recordLiveActivity } from '../../../lib/firebase.ts';

interface ActivityLogTabProps {
  telemetryEvents: any[];
}

export const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ telemetryEvents }) => {
  const [events, setEvents] = useState<any[]>(() => {
    if (telemetryEvents && telemetryEvents.length > 0) return telemetryEvents;
    return [
      { id: 'act-1', type: 'order', message: 'New order #TSU-1001 for Zen Wave Planter (₹1,188) placed via Online UPI', timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString() },
      { id: 'act-2', type: 'print', message: 'Kyoto-1 (Bambu X1C) commenced print job Zen_Wave_Planter_v4.gcode (165g)', timestamp: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString() },
      { id: 'act-3', type: 'cart', message: 'Visitor added "Torii Headphone Rest" to bag', timestamp: new Date(Date.now() - 1000 * 60 * 35).toLocaleTimeString() },
      { id: 'act-4', type: 'view', message: 'Maker browsed TsuKURI_3D Kyoto collection', timestamp: new Date(Date.now() - 1000 * 60 * 50).toLocaleTimeString() },
    ];
  });

  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventType, setEventType] = useState<'order' | 'print' | 'cart' | 'view'>('print');
  const [eventMessage, setEventMessage] = useState('');

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventMessage) return;

    recordLiveActivity(eventType, eventMessage);
    const newLog = {
      id: `act-${Date.now()}`,
      type: eventType,
      message: eventMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setEvents([newLog, ...events]);
    setIsModalOpen(false);
    setEventMessage('');
  };

  const handleClearLogs = () => {
    setEvents([]);
  };

  const filtered = filterType === 'all' ? events : events.filter((e) => e.type === filterType);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-emerald-600" />;
      case 'print':
        return <Printer className="w-4 h-4 text-blue-600" />;
      case 'cart':
        return <ShoppingBag className="w-4 h-4 text-[#ea8f5a]" />;
      default:
        return <Eye className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bubbly text-xl sm:text-2xl text-[#1a2e26] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#1e4b3e]" />
            <span>LIVE WORKSHOP ACTIVITY LOG & TELEMETRY STREAM</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time Firestore stream recording customer cart additions, live 3D print fleet jobs, and online orders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#e8ece1] p-1 rounded-full text-xs font-bold">
            {['all', 'order', 'print', 'cart', 'view'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full uppercase text-[10px] ${
                  filterType === t ? 'bg-[#1e4b3e] text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setEventMessage('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ RECORD EVENT</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="p-2 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600"
            title="Clear Log Screen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No activity events found in selected filter.
          </div>
        ) : (
          filtered.map((ev) => (
            <div key={ev.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e8ece1] flex items-center justify-center shrink-0">
                  {getEventIcon(ev.type)}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1a2e26] leading-snug">{ev.message}</p>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mt-0.5">
                    Channel: {ev.type} · Kyoto Lab Stream
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {ev.timestamp || 'Live'}
              </span>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border-4 border-[#e8ece1] space-y-4">
            <h3 className="font-bubbly text-xl text-[#1a2e26]">Record Workshop Activity</h3>
            <form onSubmit={handleAddLog} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                >
                  <option value="order">Order Transaction</option>
                  <option value="print">3D Print Fleet Action</option>
                  <option value="cart">Cart & Checkout Intent</option>
                  <option value="view">Traffic & Studio View</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Activity Log Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Kyoto-1 nozzle temperature calibrated to 220°C for Bio-PLA drop"
                  value={eventMessage}
                  onChange={(e) => setEventMessage(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-full bg-slate-100 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs shadow-md"
                >
                  BROADCAST EVENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
