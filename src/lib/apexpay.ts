import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const APEXPAY_GATEWAY_URL = 'https://apex-seven-ashy.vercel.app';
export const APEXPAY_WEBHOOK_SECRET = 'whsec_98f12a88e91d84b238ef';

export const TSUKURI_UPI_DETAILS = {
  vpa: 'joshi2010@slc',
  beneficiary: 'Aditya Joshi',
  bankName: 'North East Small Finance Bank',
  accountNumber: '033311501086572',
  ifsc: 'NESF0000333',
};

const LOGS_FILE = path.join(process.cwd(), 'data', 'apexpay_webhook_logs.json');

export interface ApexPayWebhookLog {
  id: string;
  receivedAt: string;
  orderId?: string;
  paymentId?: string;
  utr?: string;
  amount?: number;
  status?: string;
  signatureVerified: boolean;
  rawPayload: any;
  error?: string;
}

export function loadApexWebhookLogs(): ApexPayWebhookLog[] {
  try {
    if (!fs.existsSync(LOGS_FILE)) return [];
    const data = fs.readFileSync(LOGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveApexWebhookLog(log: Omit<ApexPayWebhookLog, 'id' | 'receivedAt'>): ApexPayWebhookLog {
  const current = loadApexWebhookLogs();
  const newLog: ApexPayWebhookLog = {
    ...log,
    id: `apex-wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    receivedAt: new Date().toISOString(),
  };
  current.unshift(newLog);
  if (current.length > 200) current.length = 200;

  try {
    fs.mkdirSync(path.dirname(LOGS_FILE), { recursive: true });
    fs.writeFileSync(LOGS_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save ApexPay webhook log:', err);
  }
  return newLog;
}

/**
 * Builds the exact redirect URL to Apex Live Payment Gateway
 * Format:
 * https://apex-seven-ashy.vercel.app/?checkout=live&amount=${totalAmount}&order_id=${orderId}&description=${encodeURIComponent(productTitle)}&customer_name=${customerName}&customer_email=${customerEmail}&return_url=${window.location.origin}/order-success
 */
export function buildApexCheckoutUrl(params: {
  amount: number;
  orderId: string | number;
  productTitle: string;
  customerName: string;
  customerEmail: string;
  returnUrl?: string;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tsukuri3d.store';
  const returnUrl = params.returnUrl || `${origin}/order-success`;
  
  const queryParams = new URLSearchParams({
    checkout: 'live',
    amount: String(Math.round(params.amount)),
    order_id: String(params.orderId),
    description: params.productTitle || 'Tsukuri3D Custom Print',
    customer_name: params.customerName || 'Customer',
    customer_email: params.customerEmail || '',
    return_url: returnUrl,
  });

  return `${APEXPAY_GATEWAY_URL}/?${queryParams.toString()}`;
}

/**
 * Verifies incoming webhook signatures using HMAC-SHA256
 * Secret: whsec_98f12a88e91d84b238ef
 */
export function verifyApexPaySignature(
  rawBody: string | Buffer,
  receivedSignature?: string | string[]
): { valid: boolean; computedSignature: string } {
  const secret = process.env.APEXPAY_WEBHOOK_SECRET || APEXPAY_WEBHOOK_SECRET;
  const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(bodyString);
  const computedSignature = hmac.digest('hex');

  if (!receivedSignature) {
    return { valid: false, computedSignature };
  }

  const cleanSig = String(receivedSignature).replace(/^sha256=/, '').trim();

  try {
    const sigBuf = Buffer.from(cleanSig, 'hex');
    const compBuf = Buffer.from(computedSignature, 'hex');
    if (sigBuf.length === compBuf.length && crypto.timingSafeEqual(sigBuf, compBuf)) {
      return { valid: true, computedSignature };
    }
  } catch {
    // String fallback if buffer conversion fails
  }

  const stringMatch = cleanSig.toLowerCase() === computedSignature.toLowerCase();
  return { valid: stringMatch, computedSignature };
}

/**
 * Builds UPI payment deep link
 */
export function buildUpiDeepLink(params: {
  vpa?: string;
  name?: string;
  amount: number;
  orderNumber: string;
}): string {
  const vpa = params.vpa || TSUKURI_UPI_DETAILS.vpa;
  const name = params.name || TSUKURI_UPI_DETAILS.beneficiary;
  const note = `Tsukuri3D Order #${params.orderNumber}`;
  return `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name)}&am=${params.amount}&cu=INR&tn=${encodeURIComponent(note)}`;
}
