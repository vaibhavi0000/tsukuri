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
} from 'lucide-react';

export interface ShadowfaxConfig {
  partnerName: string;
  productionToken: string;
  apiEnvironment: 'production' | 'staging';
  baseUrl: string;
  webhookSecret: string;
  requireSecret: boolean;
  autoSendCustomerEmail: boolean;
  defaultCourier: boolean;
  notifyOnDelivered: boolean;
  autoPushNewOrders: boolean;
  pickupLocation: string;
  pickupWarehouseName: string;
  pickupContactName: string;
  pickupPincode: string;
  pickupAddress: string;
  pickupAddress2?: string;
  pickupCity: string;
  pickupState: string;
  pickupPhone: string;
  pickupGstNumber?: string;
  updatedAt: string;
}

export interface ShadowfaxWebhookLogItem {
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

export interface ShadowfaxOutboundLogItem {
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
  labelUrl?: string;
  requestPayload?: any;
  responsePayload?: any;
}

interface ShadowfaxIntegrationCardProps {
  ordersList?: Array<{
    id: string | number;
    orderNumber: string;
    customerName: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    items?: any[];
    subtotalINR?: number;
    totalAmountINR?: number;
    status?: string;
    paymentMethod?: string;
    courier?: string;
    trackingNumber?: string;
  }>;
  onOrderUpdated?: () => void;
}

export const ShadowfaxIntegrationCard: React.FC<ShadowfaxIntegrationCardProps> = ({
  ordersList = [],
  onOrderUpdated,
}) => {
  const [config, setConfig] = useState<ShadowfaxConfig | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tab views within card
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'manifest' | 'logs' | 'webhooks'>('config');

  // Logs & Outbound state
  const [outboundLogs, setOutboundLogs] = useState<ShadowfaxOutboundLogItem[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<ShadowfaxWebhookLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Manifesting single order state
  const [selectedOrderToManifest, setSelectedOrderToManifest] = useState<any | null>(null);
  const [manifestingOrderId, setManifestingOrderId] = useState<string | null>(null);
  const [manifestSuccessData, setManifestSuccessData] = useState<any | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);

  // Form edit state
  const [editToken, setEditToken] = useState('a6a05ac9ce3595a4b1461d07fd83363e1f32d32d');
  const [editWarehouseName, setEditWarehouseName] = useState('Tsukuri3D Kyoto Hub');
  const [editContactName, setEditContactName] = useState('Tsukuri3D Dispatch Desk');
  const [editPincode, setEditPincode] = useState('560102');
  const [editAddress, setEditAddress] = useState('Plot 42, HSR Layout Sector 1');
  const [editCity, setEditCity] = useState('Bengaluru');
  const [editState, setEditState] = useState('Karnataka');
  const [editPhone, setEditPhone] = useState('9845033021');
  const [editAutoPush, setEditAutoPush] = useState(true);
  const [editDefaultCourier, setEditDefaultCourier] = useState(true);
  const [editAutoSendEmail, setEditAutoSendEmail] = useState(true);

  // Load config & summary on mount
  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shadowfax/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          setEditToken(data.config.productionToken || 'a6a05ac9ce3595a4b1461d07fd83363e1f32d32d');
          setEditWarehouseName(data.config.pickupWarehouseName || 'Tsukuri3D Kyoto Hub');
          setEditContactName(data.config.pickupContactName || 'Tsukuri3D Dispatch Desk');
          setEditPincode(data.config.pickupPincode || '560102');
          setEditAddress(data.config.pickupAddress || 'Plot 42, HSR Layout Sector 1');
          setEditCity(data.config.pickupCity || 'Bengaluru');
          setEditState(data.config.pickupState || 'Karnataka');
          setEditPhone(data.config.pickupPhone || '9845033021');
          setEditAutoPush(data.config.autoPushNewOrders !== false);
          setEditDefaultCourier(data.config.defaultCourier !== false);
          setEditAutoSendEmail(data.config.autoSendCustomerEmail !== false);
        }
        if (data.webhookEndpoints?.fullWebhookUrl) {
          setWebhookUrl(data.webhookEndpoints.fullWebhookUrl);
        } else {
          setWebhookUrl(`${window.location.origin}/api/webhooks/shadowfax`);
        }
      }
    } catch (err) {
      console.error('Failed to load Shadowfax config:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const [outRes, whRes] = await Promise.all([
        fetch('/api/shadowfax/outbound-logs'),
        fetch('/api/shadowfax/config'),
      ]);
      if (outRes.ok) {
        const oData = await outRes.json();
        if (Array.isArray(oData)) setOutboundLogs(oData);
      }
    } catch {}
    finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'logs' || activeSubTab === 'manifest') {
      loadLogs();
    }
  }, [activeSubTab]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/shadowfax/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionToken: editToken.trim(),
          pickupWarehouseName: editWarehouseName,
          pickupContactName: editContactName,
          pickupPincode: editPincode,
          pickupAddress: editAddress,
          pickupCity: editCity,
          pickupState: editState,
          pickupPhone: editPhone,
          autoPushNewOrders: editAutoPush,
          defaultCourier: editDefaultCourier,
          autoSendCustomerEmail: editAutoSendEmail,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Save Shadowfax config error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await fetch('/api/shadowfax/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionToken: editToken.trim(),
        }),
      });
      const data = await res.json();
      setConnectionResult(data);
    } catch (err: any) {
      setConnectionResult({
        success: false,
        status: 'FAILED',
        message: err.message || 'Connection error',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleManifestOrder = async (orderId: string | number) => {
    setManifestingOrderId(String(orderId));
    setManifestSuccessData(null);
    setManifestError(null);
    try {
      const res = await fetch(`/api/shadowfax/orders/${orderId}/manifest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setManifestSuccessData(data);
        if (onOrderUpdated) onOrderUpdated();
        loadLogs();
      } else {
        setManifestError(data.error || data.message || 'Manifesting failed');
      }
    } catch (err: any) {
      setManifestError(err.message || 'Network error while manifesting');
    } finally {
      setManifestingOrderId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#1e4b3e]/15 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ea8f5a] text-white flex items-center justify-center shrink-0 shadow-md">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bubbly text-xl text-[#1a2e26]">
                SHADOWFAX LOGISTICS API INTEGRATION
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PRODUCTION KEY ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              Official courier partner connected via production token for automated Pan-India order booking, AWB assignment, and live tracking webhook callbacks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="px-4 py-2.5 rounded-xl bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
            <span>{testingConnection ? 'VERIFYING GATEWAY...' : 'TEST PRODUCTION KEY'}</span>
          </button>

          <a
            href="https://tracker.shadowfax.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Shadowfax Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Connection Test Result Alert */}
      {connectionResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start justify-between gap-3 animate-in fade-in ${
            connectionResult.status === 'CONNECTED'
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {connectionResult.status === 'CONNECTED' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="block font-bubbly text-sm">
                {connectionResult.status === 'CONNECTED' ? 'SHADOWFAX PRODUCTION KEY VALIDATED' : 'CONNECTION NOTICE'}
              </strong>
              <p className="mt-0.5 leading-relaxed">{connectionResult.message}</p>
              <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-slate-600">
                <span>Base URL: {connectionResult.baseUrl}</span>
                <span>•</span>
                <span>Token: {connectionResult.tokenMasked}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConnectionResult(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'config'
              ? 'bg-[#1e4b3e] text-[#f3b755] shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          1. API Credentials & Pickup Hub
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('manifest')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'manifest'
              ? 'bg-[#1e4b3e] text-[#f3b755] shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          2. Order Manifest Dispatch ({ordersList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-[#1e4b3e] text-[#f3b755] shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          3. Outbound Logs ({outboundLogs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('webhooks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'webhooks'
              ? 'bg-[#1e4b3e] text-[#f3b755] shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          4. Webhook Endpoint
        </button>
      </div>

      {/* SUB TAB 1: CONFIGURATION */}
      {activeSubTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Shadowfax integration settings successfully updated & applied!</span>
            </div>
          )}

          {/* Credentials Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#ea8f5a]" />
              <h3 className="font-bubbly text-sm text-[#1a2e26]">
                SHADOWFAX PRODUCTION API TOKEN
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block uppercase">
                  Production Key Token
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editToken}
                    onChange={(e) => setEditToken(e.target.value)}
                    placeholder="Shadowfax production key token"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-[#1e4b3e] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(editToken, 'token')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Copy token"
                  >
                    {copiedKey === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Active Token: <code className="font-mono text-[#1e4b3e] font-bold">a6a05ac9ce3595a4b1461d07fd83363e1f32d32d</code>
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block uppercase">
                  API Gateway URL
                </label>
                <input
                  type="text"
                  value="https://api.shadowfax.in"
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono text-xs text-slate-600"
                />
                <span className="text-[10px] text-slate-500 block">
                  Environment: <strong className="text-emerald-700">Production Live Gateway</strong>
                </span>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={editDefaultCourier}
                  onChange={(e) => setEditDefaultCourier(e.target.checked)}
                  className="rounded text-[#1e4b3e] focus:ring-[#1e4b3e]"
                />
                <span>Set as Default Delivery Partner</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={editAutoPush}
                  onChange={(e) => setEditAutoPush(e.target.checked)}
                  className="rounded text-[#1e4b3e] focus:ring-[#1e4b3e]"
                />
                <span>Auto-Manifest New Store Orders</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={editAutoSendEmail}
                  onChange={(e) => setEditAutoSendEmail(e.target.checked)}
                  className="rounded text-[#1e4b3e] focus:ring-[#1e4b3e]"
                />
                <span>Auto-Email Tracking AWB to Customers</span>
              </label>
            </div>
          </div>

          {/* Pickup Warehouse Details */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1e4b3e]" />
              <h3 className="font-bubbly text-sm text-[#1a2e26]">
                SHADOWFAX PICKUP WAREHOUSE & DISPATCH HUB
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Warehouse Name</label>
                <input
                  type="text"
                  value={editWarehouseName}
                  onChange={(e) => setEditWarehouseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Contact Person</label>
                <input
                  type="text"
                  value={editContactName}
                  onChange={(e) => setEditContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Pickup Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block">Pickup Street Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Pickup Pincode</label>
                <input
                  type="text"
                  value={editPincode}
                  onChange={(e) => setEditPincode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">City</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">State</label>
                <input
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs tracking-wide shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'SAVING CONFIGURATION...' : 'SAVE SHADOWFAX SETTINGS'}
            </button>
          </div>
        </form>
      )}

      {/* SUB TAB 2: ORDER MANIFEST DISPATCH */}
      {activeSubTab === 'manifest' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bubbly text-sm text-[#1a2e26]">
                DISPATCH ORDERS TO SHADOWFAX
              </h3>
              <p className="text-xs text-slate-500">
                Book parcels with Shadowfax Express, generate AWB barcodes, and dispatch instantly.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {ordersList.length} Total Orders Available
            </span>
          </div>

          {manifestSuccessData && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs space-y-1 text-emerald-950 animate-in fade-in">
              <strong className="font-bubbly text-sm block flex items-center gap-1.5 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                MANIFEST SUCCESSFUL!
              </strong>
              <p>
                AWB Number: <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">{manifestSuccessData.awb}</code>
              </p>
              <p className="text-slate-600">{manifestSuccessData.message}</p>
            </div>
          )}

          {manifestError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{manifestError}</span>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Destination</th>
                  <th className="p-3">Courier / AWB</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordersList.map((ord) => {
                  const isManifested = ord.trackingNumber && ord.trackingNumber.startsWith('SFX');
                  const isManifesting = manifestingOrderId === String(ord.id);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#1e4b3e]">{ord.orderNumber}</td>
                      <td className="p-3">
                        <span className="font-bold block">{ord.customerName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{ord.phone || ord.email}</span>
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{ord.address || ord.city || 'India'}</td>
                      <td className="p-3">
                        {ord.trackingNumber ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block w-max">
                              {ord.trackingNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">Shadowfax Express</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not yet manifested</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold">₹{ord.totalAmountINR || ord.subtotalINR || 599}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleManifestOrder(ord.id)}
                          disabled={isManifesting}
                          className="px-3.5 py-1.5 rounded-xl bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bold text-[11px] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {isManifesting ? 'MANIFESTING...' : isManifested ? 'RE-MANIFEST' : 'MANIFEST WITH SHADOWFAX'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 3: OUTBOUND LOGS */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bubbly text-sm text-[#1a2e26]">
                SHADOWFAX DISPATCH & BOOKING LOGS
              </h3>
              <p className="text-xs text-slate-500">
                Audited list of parcels pushed to Shadowfax production gateway with generated waybills.
              </p>
            </div>
            <button
              type="button"
              onClick={loadLogs}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {outboundLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No outbound Shadowfax manifests booked yet. Use the Order Manifest Dispatch tab to book an order.
            </div>
          ) : (
            <div className="space-y-2">
              {outboundLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#1e4b3e]">{log.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>AWB: <strong className="font-mono text-slate-800">{log.awb}</strong></span>
                    <span className="text-[11px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 4: WEBHOOK ENDPOINT */}
      {activeSubTab === 'webhooks' && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-[#1e4b3e]" />
            <h3 className="font-bubbly text-sm text-[#1a2e26]">
              SHADOWFAX STATUS UPDATE WEBHOOK LISTENER
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Provide these exact details in your Shadowfax Client Portal under <strong>Settings &rarr; Webhooks &rarr; Add New Webhook</strong>. Shadowfax sends real-time dispatch, transit hub, out-for-delivery, and delivery completion events directly to this URL.
          </p>

          {/* Form Guide specifically matching Shadowfax Portal fields */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bubbly text-xs text-[#1e4b3e] uppercase">
                Shadowfax Portal Form Fields (tsukuri3d.vercel.app)
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Production Ready
              </span>
            </div>

            {/* Staging Details */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block uppercase">
                1. Staging Details
              </span>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold block">Client Push URL *</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value="https://tsukuri3d.vercel.app/api/webhooks/shadowfax"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-800 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://tsukuri3d.vercel.app/api/webhooks/shadowfax', 'wh-stage')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Copy Staging Push URL"
                  >
                    {copiedKey === 'wh-stage' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block">Authorisation Present</label>
                <div className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-700 font-bold">
                  No (or None)
                </div>
              </div>
            </div>

            {/* Production Details */}
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
              <span className="text-[11px] font-bold text-[#1e4b3e] block uppercase">
                2. Production Details
              </span>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold block">Client Push URL *</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value="https://tsukuri3d.vercel.app/api/webhooks/shadowfax"
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white font-mono text-xs text-slate-800 pr-10 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://tsukuri3d.vercel.app/api/webhooks/shadowfax', 'wh-prod')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Copy Production Push URL"
                  >
                    {copiedKey === 'wh-prod' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block">Authorisation Present</label>
                <div className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-700 font-bold">
                  No (or None)
                </div>
              </div>
            </div>

            {/* Integration Type */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block uppercase">
                3. Integration Type *
              </span>
              <div className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-800 font-bold">
                Forward Logistics (or Forward)
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Select <strong>Forward Logistics</strong> (or <strong>Forward / Express</strong> in the dropdown).
              </p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
            <strong>Supported Events:</strong>
            <p className="text-[11px] text-slate-500 font-mono">
              ORDER_CREATED, PICKUP_SCHEDULED, PICKED_UP, IN_TRANSIT, REACHED_DESTINATION_HUB, OUT_FOR_DELIVERY, DELIVERED, RTO_INITIATED
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
