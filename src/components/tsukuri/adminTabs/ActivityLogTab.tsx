import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Activity, Eye, ShoppingBag, Package, Printer, RefreshCw } from 'lucide-react';
import { recordLiveActivity, subscribeToLiveActivity, FirestoreActivity } from '../../../lib/firebase.ts';

interface ActivityLogTabProps {
  telemetryEvents: any[];
}

export const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ telemetryEvents }) => {
  const [events, setEvents] = useState<any[]>(() => {
    if (telemetryEvents && telemetryEvents.length > 0) return telemetryEvents;
    try {
      const stored = localStorage.getItem('tsukuri_activity_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventType, setEventType] = useState<'order' | 'print' | 'cart' | 'view'>('print');
  const [eventMessage, setEventMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync props to events
  useEffect(() => {
    if (telemetryEvents && telemetryEvents.length > 0) {
      setEvents((prev) => {
        const map = new Map<string, any>();
        [...telemetryEvents, ...prev].forEach((item) => {
          const key = item.id || `${item.timestamp}_${item.message}`;
          if (!map.has(key)) map.set(key, item);
        });
        const combined = Array.from(map.values()).slice(0, 50);
        try {
          localStorage.setItem('tsukuri_activity_logs', JSON.stringify(combined));
        } catch {}
        return combined;
      });
    }
  }, [telemetryEvents]);

  // Live polling of telemetry route & Firestore listener
  const fetchTelemetryEvents = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recentEvents) && data.recentEvents.length > 0) {
          setEvents((prev) => {
            const map = new Map<string, any>();
            [...data.recentEvents, ...prev].forEach((item: any) => {
              const key = item.id || `${item.timestamp}_${item.message}`;
              if (!map.has(key)) map.set(key, item);
            });
            const combined = Array.from(map.values()).slice(0, 50);
            try {
              localStorage.setItem('tsukuri_activity_logs', JSON.stringify(combined));
            } catch {}
            return combined;
          });
        }
      }
    } catch {} finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetryEvents();
    const interval = setInterval(fetchTelemetryEvents, 4000);

    // Listen to Firebase live stream
    const unsubscribeFirebase = subscribeToLiveActivity((fbEvents: FirestoreActivity[]) => {
      if (Array.isArray(fbEvents) && fbEvents.length > 0) {
        setEvents((prev) => {
          const map = new Map<string, any>();
          [...fbEvents, ...prev].forEach((item: any) => {
            const key = item.id || `${item.timestamp}_${item.message}`;
            if (!map.has(key)) map.set(key, item);
          });
          const combined = Array.from(map.values()).slice(0, 50);
          try {
            localStorage.setItem('tsukuri_activity_logs', JSON.stringify(combined));
          } catch {}
          return combined;
        });
      }
    });

    const handleWindowActivity = (e: any) => {
      if (e.detail) {
        const ev = {
          id: `ev-${Date.now()}`,
          type: 'order',
          message: `Order #${e.detail.orderNumber} placed by ${e.detail.customerName} (₹${e.detail.totalAmountINR || e.detail.totalAmount})`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setEvents((prev) => [ev, ...prev].slice(0, 50));
      }
    };
    const handleGeneralActivity = (e: any) => {
      if (e.detail) {
        const ev = {
          id: e.detail.id || `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: e.detail.type || 'order',
          message: e.detail.message || 'Workshop activity logged',
          timestamp: e.detail.timestamp || new Date().toLocaleTimeString(),
        };
        setEvents((prev) => [ev, ...prev].slice(0, 50));
      }
    };
    window.addEventListener('tsukuri_order_placed', handleWindowActivity);
    window.addEventListener('tsukuri_activity_event', handleGeneralActivity);

    return () => {
      clearInterval(interval);
      if (unsubscribeFirebase) unsubscribeFirebase();
      window.removeEventListener('tsukuri_order_placed', handleWindowActivity);
      window.removeEventListener('tsukuri_activity_event', handleGeneralActivity);
    };
  }, []);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventMessage.trim()) return;

    recordLiveActivity(eventType, eventMessage.trim());
    fetch('/api/telemetry/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        eventMessage: eventMessage.trim(),
      }),
    }).catch(() => {});

    const newLog = {
      id: `act-${Date.now()}`,
      type: eventType,
      message: eventMessage.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setEvents((prev) => {
      const updated = [newLog, ...prev].slice(0, 50);
      try {
        localStorage.setItem('tsukuri_activity_logs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setIsModalOpen(false);
    setEventMessage('');
  };

  const handleClearLogs = () => {
    setEvents([]);
    try {
      localStorage.removeItem('tsukuri_activity_logs');
    } catch {}
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
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              LIVE WORKSHOP TELEMETRY STREAM
            </span>
          </div>
          <h2 className="font-bubbly text-xl sm:text-2xl text-[#1a2e26] flex items-center gap-2 mt-1">
            <Activity className="w-5 h-5 text-[#1e4b3e]" />
            <span>REAL-TIME ACTIVITY LOG</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time feed tracking online visitor traffic, cart additions, live 3D printer fleet milestones, and verified checkout orders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#e8ece1] p-1 rounded-full text-xs font-bold">
            {['all', 'order', 'print', 'cart', 'view'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full uppercase text-[10px] cursor-pointer transition-all ${
                  filterType === t ? 'bg-[#1e4b3e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={fetchTelemetryEvents}
            disabled={isRefreshing}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Refresh Stream"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setEventMessage('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ RECORD EVENT</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="p-2 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 cursor-pointer"
            title="Clear Stream"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 min-h-[160px]">
        {filtered.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-600">No activity logged yet.</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Visitor page views, cart additions, and orders placed on the storefront will stream here automatically in real time.
            </p>
          </div>
        ) : (
          filtered.map((ev) => (
            <div key={ev.id || `${ev.timestamp}_${ev.message}`} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e8ece1] flex items-center justify-center shrink-0">
                  {getEventIcon(ev.type)}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1a2e26] leading-snug">{ev.message}</p>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mt-0.5">
                    Channel: {ev.type} · Kyoto Live Feed
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {ev.timestamp ? (ev.timestamp.includes('T') ? new Date(ev.timestamp).toLocaleTimeString() : ev.timestamp) : 'Live'}
              </span>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border-4 border-[#e8ece1] space-y-4">
            <h3 className="font-bubbly text-xl text-[#1a2e26]">Record Workshop Activity</h3>
            <p className="text-xs text-slate-500">
              Broadcast an operational event to the live telemetry and Firestore activity channel.
            </p>

            <form onSubmit={handleAddLog} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Channel / Type</label>
                <select
                  value={eventType}
                  onChange={(e: any) => setEventType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="print">3D Print Fleet Job</option>
                  <option value="order">Storefront Order</option>
                  <option value="cart">Cart Telemetry</option>
                  <option value="view">Visitor Navigation</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Activity Log Message</label>
                <textarea
                  value={eventMessage}
                  onChange={(e) => setEventMessage(e.target.value)}
                  placeholder="e.g. Kyoto-1 commenced printing Zen Wave Planter (165g bio-PLA)..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-[#1e4b3e] h-24 text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs"
                >
                  Broadcast Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
