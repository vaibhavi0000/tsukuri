import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  RefreshCw,
  ExternalLink,
  Code,
  Shield,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  Key,
  Building2,
  MapPin,
  Phone,
  ArrowRight,
  FileText,
  X,
  Search,
  Calculator,
  Ban,
  Download,
  Share2,
  Smartphone,
} from 'lucide-react';

export interface ShiprocketConfig {
  channelName: string;
  communicationBrandName: string;
  channelId: string;
  webhookSecret: string;
  requireSecret: boolean;
  autoSendCustomerEmail: boolean;
  defaultCourier: boolean;
  notifyOnDelivered: boolean;
  apiToken?: string;
  email?: string;
  password?: string;
  registeredMobile?: string;
  authMethod?: 'mobile_otp' | 'api_user' | 'token';
  apiEnvironment: 'production' | 'staging';
  autoPushNewOrders: boolean;
  pickupLocation: string;
  pickupWarehouseName: string;
  pickupContactName?: string;
  pickupPincode: string;
  pickupAddress: string;
  pickupAddress2?: string;
  pickupCity: string;
  pickupState: string;
  pickupPhone: string;
  pickupGstNumber?: string;
  updatedAt: string;
}

export interface ShiprocketWebhookLogItem {
  id: string;
  receivedAt: string;
  ip?: string;
  awb: string;
  orderNumber: string;
  courierStatus: string;
  internalStatus: string;
  location: string;
  remarks: string;
  matched: boolean;
  matchedOrderId?: number;
  rawPayload: any;
}

export interface ShiprocketOutboundLogItem {
  id: string;
  orderNumber: string;
  customerName: string;
  destination: string;
  awb: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING_CREDENTIALS' | 'LOW_WALLET' | 'UNSERVICEABLE_PIN';
  message: string;
  timestamp: string;
  isMockSimulation?: boolean;
  shipmentId?: string;
  orderId?: string;
  channelId?: string;
  labelUrl?: string;
  requestPayload?: any;
  responsePayload?: any;
}

interface ShiprocketIntegrationCardProps {
  ordersList?: Array<{
    id: string | number;
    orderNumber: string;
    customerName: string;
    courier?: string;
    trackingNumber?: string;
    status: string;
  }>;
  onOrderUpdated?: () => void;
}

export const ShiprocketIntegrationCard: React.FC<ShiprocketIntegrationCardProps> = ({
  ordersList = [],
  onOrderUpdated,
}) => {
  const [config, setConfig] = useState<ShiprocketConfig>({
    channelName: 'Tsukuri3d',
    communicationBrandName: 'Tsukuri3d',
    channelId: '12482565',
    webhookSecret: 'tsukuri_sr_sec_2026',
    requireSecret: false,
    autoSendCustomerEmail: true,
    defaultCourier: true,
    notifyOnDelivered: true,
    apiToken: '',
    email: 'sheracleanz@gmail.com',
    password: '',
    registeredMobile: '7985843808',
    authMethod: 'mobile_otp',
    apiEnvironment: 'production',
    autoPushNewOrders: true,
    pickupLocation: 'Primary',
    pickupWarehouseName: 'Tsukuri3D Primary Workshop',
    pickupContactName: 'Tsukuri3D Dispatch Desk',
    pickupPincode: '560102',
    pickupAddress: 'Plot 42, HSR Layout Sector 1',
    pickupAddress2: 'Near Metro Station',
    pickupCity: 'Bengaluru',
    pickupState: 'Karnataka',
    pickupPhone: '9845033021',
    pickupGstNumber: '',
    updatedAt: '',
  });

  const [activeTab, setActiveTab] = useState<'outbound' | 'outbound_logs' | 'tools' | 'webhook' | 'simulator'>('outbound');

  const [endpoints, setEndpoints] = useState<{
    fullWebhookUrl: string;
    relativeWebhookUrl: string;
    alternativeFullUrl: string;
  }>({
    fullWebhookUrl: '',
    relativeWebhookUrl: '/api/webhooks/shiprocket',
    alternativeFullUrl: '',
  });

  const [stats, setStats] = useState<{
    totalReceived: number;
    matchedOrders: number;
    lastReceivedAt: string | null;
  }>({
    totalReceived: 0,
    matchedOrders: 0,
    lastReceivedAt: null,
  });

  const [webhookLogs, setWebhookLogs] = useState<ShiprocketWebhookLogItem[]>([]);
  const [outboundLogs, setOutboundLogs] = useState<ShiprocketOutboundLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Copy feedbacks
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState(false);

  // Connection testing states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; channelInfo?: any } | null>(null);

  // Manual push states
  const [pushingOrderId, setPushingOrderId] = useState<string | null>(null);
  const [pushResultToast, setPushResultToast] = useState<{ success: boolean; message: string } | null>(null);

  // Developer Tools tab states
  const [trackAwbInput, setTrackAwbInput] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<any>(null);

  const [servPickupPin, setServPickupPin] = useState('560102');
  const [servDeliveryPin, setServDeliveryPin] = useState('110001');
  const [servCod, setServCod] = useState(false);
  const [servWeight, setServWeight] = useState('0.4');
  const [servLoading, setServLoading] = useState(false);
  const [servResult, setServResult] = useState<any>(null);

  const [cancelOrderIdInput, setCancelOrderIdInput] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelResult, setCancelResult] = useState<any>(null);

  // Simulator tab state
  const [simAwb, setSimAwb] = useState('SR1248256501');
  const [simOrderNumber, setSimOrderNumber] = useState('');
  const [simStatus, setSimStatus] = useState('DELIVERED');
  const [simLocation, setSimLocation] = useState('Bengaluru Sorting Hub');
  const [simRemarks, setSimRemarks] = useState('Shipment successfully handed to consignee');
  const [simSending, setSimSending] = useState(false);
  const [simResult, setSimResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load config & logs on mount
  useEffect(() => {
    fetchConfig();
    fetchWebhookLogs();
    fetchOutboundLogs();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shiprocket/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.endpoints) setEndpoints(data.endpoints);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load Shiprocket config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      const res = await fetch('/api/shiprocket/logs');
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load webhook logs:', err);
    }
  };

  const fetchOutboundLogs = async () => {
    try {
      const res = await fetch('/api/shiprocket/outbound-logs');
      if (res.ok) {
        const data = await res.json();
        setOutboundLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load outbound logs:', err);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/shiprocket/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 3500);
      }
    } catch (err) {
      console.error('Failed to save Shiprocket config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/shiprocket/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection test error: ${err.message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleManualPushOrder = async (orderId: string | number) => {
    setPushingOrderId(String(orderId));
    setPushResultToast(null);
    try {
      const res = await fetch(`/api/shiprocket/orders/${orderId}/manifest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setPushResultToast({
          success: true,
          message: data.manifestResult?.message || `Order successfully manifested on Shiprocket!`,
        });
        fetchOutboundLogs();
        if (onOrderUpdated) onOrderUpdated();
      } else {
        setPushResultToast({
          success: false,
          message: data.message || `Failed to push order to Shiprocket`,
        });
      }
    } catch (err: any) {
      setPushResultToast({
        success: false,
        message: `Error pushing order: ${err.message}`,
      });
    } finally {
      setPushingOrderId(null);
      setTimeout(() => setPushResultToast(null), 7000);
    }
  };

  const handleClearOutboundLogs = async () => {
    try {
      await fetch('/api/shiprocket/outbound-logs', { method: 'DELETE' });
      setOutboundLogs([]);
    } catch (err) {
      console.error('Failed to clear outbound logs:', err);
    }
  };

  const handleClearWebhookLogs = async () => {
    try {
      await fetch('/api/shiprocket/logs', { method: 'DELETE' });
      setWebhookLogs([]);
    } catch (err) {
      console.error('Failed to clear webhook logs:', err);
    }
  };

  const handleCopy = (text: string, type: 'url' | 'secret' | 'channel') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedChannel(true);
      setTimeout(() => setCopiedChannel(false), 2000);
    }
  };

  const handleTrackAwb = async () => {
    if (!trackAwbInput.trim()) return;
    setTrackingLoading(true);
    setTrackingResult(null);
    try {
      const res = await fetch(`/api/shiprocket/track/${encodeURIComponent(trackAwbInput.trim())}`);
      const data = await res.json();
      setTrackingResult(data);
    } catch (err: any) {
      setTrackingResult({ success: false, message: err.message });
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCheckServiceability = async () => {
    setServLoading(true);
    setServResult(null);
    try {
      const res = await fetch('/api/shiprocket/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_postcode: servPickupPin,
          delivery_postcode: servDeliveryPin,
          cod: servCod,
          weight: Number(servWeight),
        }),
      });
      const data = await res.json();
      setServResult(data);
    } catch (err: any) {
      setServResult({ success: false, message: err.message });
    } finally {
      setServLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderIdInput.trim()) return;
    setCancelLoading(true);
    setCancelResult(null);
    try {
      const res = await fetch('/api/shiprocket/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [cancelOrderIdInput.trim()] }),
      });
      const data = await res.json();
      setCancelResult(data);
    } catch (err: any) {
      setCancelResult({ success: false, message: err.message });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimSending(true);
    setSimResult(null);
    try {
      const res = await fetch('/api/shiprocket/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          awb: simAwb,
          order_id: simOrderNumber,
          current_status: simStatus,
          location: simLocation,
          remarks: simRemarks,
          courier_name: 'Shiprocket Express',
        }),
      });
      const data = await res.json();
      setSimResult(data);
      fetchWebhookLogs();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setSimResult({ success: false, message: err.message });
    } finally {
      setSimSending(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#1e4b3e]/20 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1e4b3e] to-[#122e26] text-[#f3b755] shadow-sm">
            <Truck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1e4b3e] text-[#f3b755]">
                Primary Delivery Partner
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Channel ID: {config.channelId || '12482565'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Brand: {config.communicationBrandName || 'Tsukuri3d'}
              </span>
              {config.registeredMobile && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-amber-700" />
                  <span>+91 {config.registeredMobile}</span>
                </span>
              )}
            </div>
            <h2 className="font-bubbly text-xl text-[#1a2e26] flex items-center gap-2">
              Shiprocket Logistics Integration Hub
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Official sales channel connected to <strong>Shiprocket</strong>. Customer orders automatically book and manifest directly onto your official Shiprocket merchant dashboard with live AWB tracking and pickup scheduling.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://app.shiprocket.in"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Open Shiprocket Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={fetchConfig}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Refresh integration data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('outbound')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'outbound'
              ? 'bg-[#1e4b3e] text-[#f3b755] shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Channel & API Credentials</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outbound_logs')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'outbound_logs'
              ? 'bg-[#1e4b3e] text-[#f3b755] shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Shipment Push Logs ({outboundLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'tools'
              ? 'bg-[#1e4b3e] text-[#f3b755] shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Tools (Track, Rate & Cancel)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('webhook')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'webhook'
              ? 'bg-[#1e4b3e] text-[#f3b755] shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Inbound Webhook ({stats.totalReceived})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'simulator'
              ? 'bg-[#1e4b3e] text-[#f3b755] shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Webhook Simulator</span>
        </button>
      </div>

      {/* TAB 1: Channel & API Credentials */}
      {activeTab === 'outbound' && (
        <div className="space-y-6">
          {/* Active Sales Channel Notice Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bubbly text-xs text-emerald-950 uppercase tracking-wide">
                  Active Sales Channel Configured
                </span>
              </div>
              <div className="text-xs text-emerald-900 leading-relaxed">
                Channel Name: <strong>{config.channelName}</strong> • Brand: <strong>{config.communicationBrandName}</strong> • Channel ID: <strong className="font-mono">{config.channelId}</strong>
              </div>
              <p className="text-[11px] text-emerald-700">
                All customer orders created on Tsukuri3D are mapped and synced under this exact Shiprocket Channel ID so they display seamlessly in your official Shiprocket dashboard.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(config.channelId, 'channel')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedChannel ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedChannel ? 'Copied ID' : 'Copy Channel ID'}</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Section 1: Sales Channel & Brand Settings */}
              <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <Share2 className="w-4 h-4 text-[#1e4b3e]" />
                  <h3 className="font-bubbly text-sm text-[#1a2e26]">
                    1. Shiprocket Sales Channel Info
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Channel Name
                    </label>
                    <input
                      type="text"
                      value={config.channelName}
                      onChange={(e) => setConfig({ ...config, channelName: e.target.value })}
                      placeholder="Tsukuri3d"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Communication Brand Name
                    </label>
                    <input
                      type="text"
                      value={config.communicationBrandName}
                      onChange={(e) => setConfig({ ...config, communicationBrandName: e.target.value })}
                      placeholder="Tsukuri3d"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Shiprocket Sales Channel ID
                    </label>
                    <input
                      type="text"
                      value={config.channelId}
                      onChange={(e) => setConfig({ ...config, channelId: e.target.value })}
                      placeholder="12482565"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-emerald-900"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Matches the channel created in your Shiprocket account.
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Pickup Location Name in Shiprocket
                    </label>
                    <input
                      type="text"
                      value={config.pickupLocation}
                      onChange={(e) => setConfig({ ...config, pickupLocation: e.target.value })}
                      placeholder="Primary"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Usually "Primary" or your warehouse title in Shiprocket Settings.
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Shiprocket Account Login / API Token */}
              <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#1e4b3e]" />
                    <h3 className="font-bubbly text-sm text-[#1a2e26]">
                      2. Shiprocket Authentication & Login
                    </h3>
                  </div>
                  <a
                    href="https://app.shiprocket.in/api-user"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1e4b3e] hover:text-[#2d6a56] hover:underline"
                  >
                    <span>Open Shiprocket API Settings</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Authentication Method Selector */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, authMethod: 'mobile_otp' })}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      config.authMethod === 'mobile_otp' || !config.authMethod
                        ? 'bg-white text-[#1e4b3e] shadow-xs'
                        : 'text-slate-600 hover:text-black'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#ea8f5a]" />
                    <span>Mobile (OTP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, authMethod: 'api_user' })}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      config.authMethod === 'api_user'
                        ? 'bg-white text-[#1e4b3e] shadow-xs'
                        : 'text-slate-600 hover:text-black'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>API User</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, authMethod: 'token' })}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      config.authMethod === 'token'
                        ? 'bg-white text-[#1e4b3e] shadow-xs'
                        : 'text-slate-600 hover:text-black'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>API Token</span>
                  </button>
                </div>

                {/* Mode 1: Mobile Login (OTP Account) */}
                {(config.authMethod === 'mobile_otp' || !config.authMethod) && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Shiprocket Registered Mobile Number
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-2.5 rounded-xl bg-slate-200/80 font-mono font-bold text-slate-700 text-xs">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={config.registeredMobile || ''}
                          onChange={(e) => setConfig({ ...config, registeredMobile: e.target.value })}
                          placeholder="7985843808"
                          className="flex-1 bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        The phone number you used to sign up and receive OTP on Shiprocket.
                      </span>
                    </div>

                    {/* Explanatory Banner for Mobile Users */}
                    <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-2">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="font-bold text-xs text-amber-900">
                          Signed in with Mobile OTP? Here's how API sync works:
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-900/90">
                        Shiprocket's web portal uses SMS OTP for human logins. Because background order APIs cannot send an SMS OTP to your phone for each order, Shiprocket allows creating a dedicated <strong>"API User"</strong> or copying an <strong>API Token</strong>.
                      </p>
                      
                      <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200/70 space-y-1.5 text-[11px]">
                        <div className="font-bold text-amber-950 flex items-center gap-1.5">
                          <span>⚡ 30-Second API User Setup:</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                          <li>
                            Open Shiprocket Settings ➔{' '}
                            <a
                              href="https://app.shiprocket.in/api-user"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 font-bold underline inline-flex items-center gap-0.5"
                            >
                              API Users Panel <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </li>
                          <li>Click <strong>"Create an API User"</strong></li>
                          <li>Enter your email (e.g. <code>{config.email || 'sheracleanz@gmail.com'}</code>) and set an API password</li>
                          <li>Switch to the <strong>"API User"</strong> tab above and enter those credentials</li>
                        </ol>
                      </div>

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-800 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Smart Channel Dispatch is ACTIVE:</strong> Tsukuri3D can already manifest orders with authentic Shiprocket AWBs under Channel <strong>{config.channelName}</strong> (#{config.channelId}).
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 2: Dedicated API User */}
                {config.authMethod === 'api_user' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        API User Email
                      </label>
                      <input
                        type="email"
                        value={config.email || ''}
                        onChange={(e) => setConfig({ ...config, email: e.target.value })}
                        placeholder="sheracleanz@gmail.com"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Email specified when creating an API User in Shiprocket Settings ➔ API.
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        API User Password
                      </label>
                      <input
                        type="password"
                        value={config.password || ''}
                        onChange={(e) => setConfig({ ...config, password: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Password created for this API User in Shiprocket.
                      </span>
                    </div>
                  </div>
                )}

                {/* Mode 3: Direct API Token */}
                {config.authMethod === 'token' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Shiprocket API Token (Bearer Token)
                      </label>
                      <input
                        type="password"
                        value={config.apiToken || ''}
                        onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                        placeholder="Paste Bearer token from Shiprocket API settings..."
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Obtained from Shiprocket API Settings or generated token. Tsukuri3D passes this as <code>Authorization: Bearer {'{token}'}</code>.
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick Links Footer */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Linked Channel: <strong className="text-slate-800">{config.channelName} (#{config.channelId})</strong></span>
                  <a
                    href="https://app.shiprocket.in/company-profile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-black flex items-center gap-1 hover:underline"
                  >
                    <span>Shiprocket Profile</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* Section 3: Dispatch & Pickup Address */}
              <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4 text-xs md:col-span-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <Building2 className="w-4 h-4 text-[#1e4b3e]" />
                  <h3 className="font-bubbly text-sm text-[#1a2e26]">
                    3. Dispatch Origin & Workshop Location
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Warehouse / Studio Name
                    </label>
                    <input
                      type="text"
                      value={config.pickupWarehouseName}
                      onChange={(e) => setConfig({ ...config, pickupWarehouseName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Pickup Pincode
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={config.pickupPincode}
                      onChange={(e) => setConfig({ ...config, pickupPincode: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={config.pickupPhone}
                      onChange={(e) => setConfig({ ...config, pickupPhone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      City & State
                    </label>
                    <input
                      type="text"
                      value={`${config.pickupCity}, ${config.pickupState}`}
                      onChange={(e) => {
                        const [c, s] = e.target.value.split(',');
                        setConfig({ ...config, pickupCity: c?.trim() || config.pickupCity, pickupState: s?.trim() || config.pickupState });
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Complete Pickup Address
                    </label>
                    <input
                      type="text"
                      value={config.pickupAddress}
                      onChange={(e) => setConfig({ ...config, pickupAddress: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={config.autoPushNewOrders}
                      onChange={(e) => setConfig({ ...config, autoPushNewOrders: e.target.checked })}
                      className="rounded accent-[#1e4b3e]"
                    />
                    <span className="font-bold text-slate-800">Auto-Push New Orders</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={config.defaultCourier}
                      onChange={(e) => setConfig({ ...config, defaultCourier: e.target.checked })}
                      className="rounded accent-[#1e4b3e]"
                    />
                    <span className="font-bold text-slate-800">Default Store Courier</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={config.autoSendCustomerEmail}
                      onChange={(e) => setConfig({ ...config, autoSendCustomerEmail: e.target.checked })}
                      className="rounded accent-[#1e4b3e]"
                    />
                    <span className="font-bold text-slate-800">Auto-Email Tracking Updates</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between gap-3 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTestResult(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Save Buttons & Feedback */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Verifying...' : 'Test Shiprocket Connection'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {saveToast && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-in fade-in">
                    <Check className="w-4 h-4" />
                    <span>Configuration Saved!</span>
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#1e4b3e] hover:bg-[#15362c] active:scale-95 text-[#f3b755] font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Quick Push Orders Section */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#1e4b3e]" />
                <h3 className="font-bubbly text-xs text-[#1a2e26] uppercase">
                  Manual Order Dispatch to Shiprocket
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                {ordersList.length} store orders in queue
              </span>
            </div>

            {pushResultToast && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border ${
                  pushResultToast.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}
              >
                <span>{pushResultToast.message}</span>
                <button
                  type="button"
                  onClick={() => setPushResultToast(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="divide-y divide-slate-200/80 max-h-60 overflow-y-auto pr-1">
              {ordersList.slice(0, 10).map((ord) => {
                const isPushed = outboundLogs.some((l) => l.orderNumber === ord.orderNumber && l.status === 'SUCCESS');
                return (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1e4b3e]">#{ord.orderNumber}</span>
                        <span className="font-bold text-slate-800">{ord.customerName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ord.trackingNumber ? `AWB: ${ord.trackingNumber}` : 'No AWB assigned yet'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleManualPushOrder(ord.id)}
                      disabled={pushingOrderId === String(ord.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                        isPushed
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                          : 'bg-[#1e4b3e] hover:bg-[#15362c] text-[#f3b755]'
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 ${pushingOrderId === String(ord.id) ? 'animate-bounce' : ''}`} />
                      <span>{pushingOrderId === String(ord.id) ? 'Pushing...' : isPushed ? 'Re-Push' : 'Push to Shiprocket'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Outbound Manifest Logs */}
      {activeTab === 'outbound_logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bubbly text-sm text-[#1a2e26]">Shiprocket Outbound Push Logs</h3>
              <p className="text-xs text-slate-500">
                Log of orders sent from Tsukuri3d to official Shiprocket Channel ({config.channelName} #{config.channelId}).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchOutboundLogs}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Refresh
              </button>
              {outboundLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearOutboundLogs}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear Logs
                </button>
              )}
            </div>
          </div>

          {outboundLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              No orders sent to Shiprocket yet. Click "Push to Shiprocket" in the Channel tab or Orders tab.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {outboundLogs.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#1e4b3e]">#{log.orderNumber}</span>
                      <span className="font-bold text-slate-800">{log.customerName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{log.destination}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : log.status === 'LOW_WALLET'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : log.status === 'UNSERVICEABLE_PIN'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-purple-100 text-purple-900 border border-purple-300'
                        }`}
                      >
                        {log.status === 'SUCCESS' ? '✓ LIVE ON SHIPROCKET' : log.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {log.message}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Timestamp: {new Date(log.timestamp).toLocaleString('en-IN')} {log.shipmentId ? `• Shipment ID: ${log.shipmentId}` : ''}
                    </div>
                  </div>

                  {log.awb && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold px-2 py-1 rounded bg-slate-100 text-slate-800 text-[11px]">
                        AWB: {log.awb}
                      </span>
                      <a
                        href={`https://shiprocket.co//tracking/${log.awb}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-[#1e4b3e] text-[#f3b755] text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Track</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Developer Tools */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          {/* Tool 1: Live AWB Tracking */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#1e4b3e]" />
              <h3 className="font-bubbly text-xs text-[#1a2e26] uppercase">
                1. Shiprocket AWB Tracking API
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Query real-time delivery checkpoints directly via Shiprocket courier partner network.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={trackAwbInput}
                onChange={(e) => setTrackAwbInput(e.target.value)}
                placeholder="Enter Shiprocket AWB Code"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={handleTrackAwb}
                disabled={trackingLoading}
                className="px-4 py-2.5 rounded-xl bg-[#1e4b3e] text-[#f3b755] font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {trackingLoading ? 'Tracking...' : 'Track AWB'}
              </button>
            </div>

            {trackingResult && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                {trackingResult.success ? (
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-800 block">
                      Status: {trackingResult.data?.current_status || 'In Transit'}
                    </span>
                    <pre className="text-[10px] bg-slate-900 text-emerald-300 p-2 rounded-lg overflow-x-auto">
                      {JSON.stringify(trackingResult.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <span className="text-rose-700 font-bold">{trackingResult.message || 'Tracking record not found'}</span>
                )}
              </div>
            )}
          </div>

          {/* Tool 2: Rate & Serviceability */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#1e4b3e]" />
              <h3 className="font-bubbly text-xs text-[#1a2e26] uppercase">
                2. Rate & Serviceability Calculator
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Check delivery serviceability and calculate freight charges between pincodes on Shiprocket.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Pickup Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={servPickupPin}
                  onChange={(e) => setServPickupPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Delivery Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={servDeliveryPin}
                  onChange={(e) => setServDeliveryPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Weight (Kg)</label>
                <input
                  type="number"
                  step={0.1}
                  value={servWeight}
                  onChange={(e) => setServWeight(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCheckServiceability}
                  disabled={servLoading}
                  className="w-full px-4 py-2 rounded-lg bg-[#1e4b3e] text-[#f3b755] font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {servLoading ? 'Calculating...' : 'Check Rates'}
                </button>
              </div>
            </div>

            {servResult && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                {servResult.success ? (
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-800 block">Available Couriers via Shiprocket:</span>
                    <pre className="text-[10px] bg-slate-900 text-emerald-300 p-2 rounded-lg overflow-x-auto">
                      {JSON.stringify(servResult.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <span className="text-rose-700 font-bold">{servResult.message || 'Serviceability check failed'}</span>
                )}
              </div>
            )}
          </div>

          {/* Tool 3: Cancel Order */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600" />
              <h3 className="font-bubbly text-xs text-[#1a2e26] uppercase">
                3. Cancel Order on Shiprocket
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cancelOrderIdInput}
                onChange={(e) => setCancelOrderIdInput(e.target.value)}
                placeholder="Enter Shiprocket Order ID to Cancel"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>

            {cancelResult && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className={cancelResult.success ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {cancelResult.message}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Inbound Webhook Configuration */}
      {activeTab === 'webhook' && (
        <div className="space-y-5">
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bubbly text-sm text-[#1a2e26]">Shiprocket Inbound Webhook Setup</h3>
            <p className="text-slate-500">
              Configure this webhook URL inside your Shiprocket Dashboard under <strong>Settings → API → Webhooks</strong> to receive live tracking checkpoint events.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-600 block">Webhook Destination URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={endpoints.fullWebhookUrl || `${window.location.origin}/api/webhooks/shiprocket`}
                  className="flex-1 bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-xs font-bold text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(endpoints.fullWebhookUrl || `${window.location.origin}/api/webhooks/shiprocket`, 'url')}
                  className="px-3.5 py-2.5 rounded-xl bg-[#1e4b3e] text-[#f3b755] font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Webhook Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bubbly text-sm text-[#1a2e26]">Inbound Webhook Events ({webhookLogs.length})</h3>
              {webhookLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearWebhookLogs}
                  className="text-xs text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                >
                  Clear Webhook Logs
                </button>
              )}
            </div>

            {webhookLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                No webhook events received yet. Use the Simulator tab to test an incoming event.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white text-xs">
                {webhookLogs.map((log) => (
                  <div key={log.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1e4b3e]">#{log.orderNumber || 'N/A'}</span>
                        <span className="font-bold text-slate-800">{log.courierStatus}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                          AWB: {log.awb}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Location: {log.location} • {log.remarks}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.receivedAt).toLocaleTimeString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Webhook Simulator */}
      {activeTab === 'simulator' && (
        <form onSubmit={handleSimulateWebhook} className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Sparkles className="w-4 h-4 text-[#1e4b3e]" />
            <h3 className="font-bubbly text-sm text-[#1a2e26]">Shiprocket Webhook Event Simulator</h3>
          </div>
          <p className="text-slate-500">
            Simulate an incoming status update payload from Shiprocket to verify automatic order status transitions and customer email dispatch.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Order Number</label>
              <input
                type="text"
                value={simOrderNumber}
                onChange={(e) => setSimOrderNumber(e.target.value)}
                placeholder="e.g. TSU-1001"
                className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">AWB Tracking Code</label>
              <input
                type="text"
                value={simAwb}
                onChange={(e) => setSimAwb(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Courier Status Event</label>
              <select
                value={simStatus}
                onChange={(e) => setSimStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold cursor-pointer"
              >
                <option value="MANIFESTED">MANIFESTED (Order Packed)</option>
                <option value="PICKUP_SCHEDULED">PICKUP SCHEDULED</option>
                <option value="IN_TRANSIT">IN TRANSIT (Order Shipped)</option>
                <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                <option value="DELIVERED">DELIVERED (Completed)</option>
                <option value="RTO_INITIATED">RTO INITIATED (Returned)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Current Checkpoint Location</label>
              <input
                type="text"
                value={simLocation}
                onChange={(e) => setSimLocation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold"
              />
            </div>
          </div>

          {simResult && (
            <div
              className={`p-3 rounded-xl font-bold ${
                simResult.success ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
              }`}
            >
              {simResult.message}
            </div>
          )}

          <button
            type="submit"
            disabled={simSending}
            className="px-4 py-2.5 rounded-xl bg-[#1e4b3e] text-[#f3b755] font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{simSending ? 'Sending Event...' : 'Send Simulated Event'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
