import nodemailer, { type Transporter } from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';

export interface EmailDispatchRecord {
  id: string;
  orderNumber: string;
  recipient: string;
  customerName: string;
  subject: string;
  sentAt: string;
  status: 'delivered' | 'sent' | 'failed';
  provider?: string;
  previewUrl?: string;
  messageId?: string;
  error?: string;
}

export interface SmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  fromName?: string;
  fromEmail?: string;
}

// In-memory log of automatically dispatched invoices
export const dispatchedEmailsLog: EmailDispatchRecord[] = [];

const SMTP_CONFIG_FILE = path.resolve(process.cwd(), 'data/smtp_config.json');

function loadPersistedSmtpConfig(): SmtpConfig {
  try {
    if (fs.existsSync(SMTP_CONFIG_FILE)) {
      const content = fs.readFileSync(SMTP_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      const rawPass = parsed.pass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASS || '';
      return {
        host: parsed.host || process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parsed.port || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465),
        secure: parsed.secure ?? true,
        user: (parsed.user || process.env.SMTP_USER || process.env.GMAIL_USER || 'commersgyan@gmail.com').trim(),
        pass: rawPass.replace(/\s+/g, ''),
        fromName: parsed.fromName || 'TsuKURI_3D Official Support',
        fromEmail: (parsed.fromEmail || process.env.SMTP_FROM || 'commersgyan@gmail.com').trim(),
      };
    }
  } catch (err) {
    console.warn('[ServerMailer] Could not read persisted smtp_config.json:', err);
  }
  const defaultPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASS || '').replace(/\s+/g, '');
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
    secure: process.env.SMTP_SECURE === 'true' || true,
    user: (process.env.SMTP_USER || process.env.GMAIL_USER || 'commersgyan@gmail.com').trim(),
    pass: defaultPass,
    fromName: 'TsuKURI_3D Official Support',
    fromEmail: (process.env.SMTP_FROM || 'commersgyan@gmail.com').trim(),
  };
}

function savePersistedSmtpConfig(config: SmtpConfig) {
  try {
    const dir = path.dirname(SMTP_CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const cleanConfig = {
      ...config,
      user: config.user?.trim(),
      pass: config.pass ? config.pass.replace(/\s+/g, '') : '',
      fromEmail: config.fromEmail?.trim(),
    };
    fs.writeFileSync(SMTP_CONFIG_FILE, JSON.stringify(cleanConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ServerMailer] Failed to save smtp_config.json:', err);
  }
}

// Dynamic SMTP configuration (persisted to data/smtp_config.json)
let dynamicSmtpConfig: SmtpConfig = loadPersistedSmtpConfig();

export function updateServerSmtpConfig(config: Partial<SmtpConfig>) {
  const cleanPass = config.pass !== undefined ? config.pass.replace(/\s+/g, '') : dynamicSmtpConfig.pass;
  dynamicSmtpConfig = {
    ...dynamicSmtpConfig,
    ...config,
    user: config.user !== undefined ? config.user.trim() : dynamicSmtpConfig.user,
    pass: cleanPass,
    fromEmail: config.fromEmail !== undefined ? config.fromEmail.trim() : dynamicSmtpConfig.fromEmail,
  };
  savePersistedSmtpConfig(dynamicSmtpConfig);
  etherealTransporter = null;
  etherealInitPromise = null;
}

export function getServerSmtpConfig(): SmtpConfig & { isConfigured: boolean } {
  return {
    ...dynamicSmtpConfig,
    pass: dynamicSmtpConfig.pass ? '••••••••' : '',
    isConfigured: !!(dynamicSmtpConfig.user && dynamicSmtpConfig.pass && dynamicSmtpConfig.pass.length >= 8),
  };
}

let etherealTransporter: Transporter | null = null;
let etherealInitPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<{ transporter: Transporter; fromAddress: string; isRealSmtp: boolean }> {
  // 1. If real SMTP (or Gmail) credentials are provided
  const user = dynamicSmtpConfig.user?.trim();
  const pass = dynamicSmtpConfig.pass?.replace(/\s+/g, '');

  if (user && pass && pass.length >= 8) {
    const host = dynamicSmtpConfig.host || 'smtp.gmail.com';
    const port = dynamicSmtpConfig.port || (host.includes('gmail') ? 465 : 587);
    const secure = dynamicSmtpConfig.secure ?? (port === 465);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
    const fromAddress = `"${dynamicSmtpConfig.fromName || 'TsuKURI_3D Support'}" <${dynamicSmtpConfig.fromEmail || user}>`;
    return { transporter, fromAddress, isRealSmtp: true };
  }

  // 2. Local instant JSON transporter when SMTP pass is pending
  if (!etherealTransporter) {
    etherealTransporter = nodemailer.createTransport({ jsonTransport: true });
  }

  const fromAddress = `"${dynamicSmtpConfig.fromName || 'Official Studio Support'}" <${dynamicSmtpConfig.fromEmail || 'commersgyan@gmail.com'}>`;
  return { transporter: etherealTransporter, fromAddress, isRealSmtp: false };
}

/**
 * Validates SMTP configuration and tests live connection
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  if (!dynamicSmtpConfig.user || !dynamicSmtpConfig.pass) {
    return {
      success: false,
      message: 'SMTP credentials missing. Please enter your Gmail/SMTP user and 16-character Google App Password in Admin Settings.',
    };
  }

  try {
    const { transporter } = await getTransporter();
    await transporter.verify();
    return {
      success: true,
      message: `Verified! Successfully authenticated with ${dynamicSmtpConfig.host || 'Gmail SMTP'} for account ${dynamicSmtpConfig.user}. All invoices will deliver directly to customer inboxes!`,
    };
  } catch (err: any) {
    console.error('[ServerMailer] SMTP Verification Error:', err);
    return {
      success: false,
      message: `SMTP Connection Failed: ${err.message || 'Authentication error'}. If using Gmail, make sure 2-Step Verification is active and use a 16-character App Password (not your normal Gmail password).`,
    };
  }
}

export async function sendBackendInvoiceEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  emailHTML: string;
  plainText?: string;
}): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
  const { to, customerName, orderNumber, totalAmount, emailHTML, plainText } = params;

  if (!to) {
    console.warn('[ServerMailer] Cannot send email: No recipient email address provided');
    return { success: false, error: 'No recipient email address' };
  }

  // Persist invoice HTML to disk for instant view and archival
  try {
    const invDir = path.resolve(process.cwd(), 'data/invoices');
    if (!fs.existsSync(invDir)) {
      fs.mkdirSync(invDir, { recursive: true });
    }
    fs.writeFileSync(path.join(invDir, `${orderNumber}.html`), emailHTML, 'utf-8');
  } catch (saveErr) {
    console.warn('[ServerMailer] Could not archive invoice HTML:', saveErr);
  }

  try {
    const { transporter, fromAddress, isRealSmtp } = await getTransporter();

    const subject = `Tax Invoice & Dispatch Receipt - Order #${orderNumber} - TsuKURI_3D`;
    const textContent =
      plainText ||
      `Order #${orderNumber} Confirmed\nTotal: ₹${totalAmount}\nThank you ${customerName}! Your tax invoice has been dispatched by Support.\nDelivery ETA: 3 to 4 Days Pan-India Express.`;

    let info: any;
    let deliveryStatus: 'delivered' | 'sent' | 'failed' = 'delivered';
    let deliveryError: string | undefined = undefined;

    if (isRealSmtp) {
      // Live SMTP send with timeout protection
      const sendPromise = transporter.sendMail({
        from: fromAddress,
        to: to.trim(),
        subject,
        text: textContent,
        html: emailHTML,
      });

      const sendTimeout = new Promise<any>((_, reject) => {
        setTimeout(() => reject(new Error('SMTP connection timed out after 8 seconds')), 8000);
      });

      try {
        info = await Promise.race([sendPromise, sendTimeout]);
        console.log(`[ServerMailer] Live SMTP sent to ${to} for #${orderNumber}. Response:`, info?.response || info?.messageId);
      } catch (sendErr: any) {
        console.error(`[ServerMailer] Live SMTP delivery error to ${to}:`, sendErr.message);
        deliveryStatus = 'failed';
        deliveryError = sendErr.message || 'SMTP Authentication / Network error';
        info = { messageId: `<err-${Date.now()}@tsukuri3d.store>` };
      }
    } else {
      // Local verified invoice dispatch record
      info = await transporter.sendMail({
        from: fromAddress,
        to: to.trim(),
        subject,
        text: textContent,
        html: emailHTML,
      });
      deliveryStatus = 'sent';
      deliveryError = 'SMTP Password pending: Invoices are auto-logged & available online. Add Gmail 16-character App Password in Settings to deliver directly to customer inbox.';
    }

    const messageId = info?.messageId || `<inv-${Date.now()}@tsukuri3d.store>`;

    const record: EmailDispatchRecord = {
      id: `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderNumber,
      recipient: to.trim(),
      customerName,
      subject,
      sentAt: new Date().toISOString(),
      status: deliveryStatus,
      provider: isRealSmtp ? (dynamicSmtpConfig.host || 'Gmail SMTP') : 'Studio Mailer (App Password Pending)',
      messageId,
      error: deliveryError,
    };

    dispatchedEmailsLog.unshift(record);
    if (dispatchedEmailsLog.length > 50) {
      dispatchedEmailsLog.pop();
    }

    console.log(`[ServerMailer] Logged tax invoice for #${orderNumber} to ${to}. Status: ${deliveryStatus}`);

    return {
      success: deliveryStatus !== 'failed',
      messageId,
      error: deliveryError,
    };
  } catch (err: any) {
    console.error(`[ServerMailer] Failed to process invoice for #${orderNumber} to ${to}:`, err);
    const failedRecord: EmailDispatchRecord = {
      id: `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderNumber,
      recipient: to,
      customerName,
      subject: `Tax Invoice #${orderNumber}`,
      sentAt: new Date().toISOString(),
      status: 'failed',
      provider: dynamicSmtpConfig.host || 'Gmail SMTP',
      error: err.message || 'Dispatch error',
      messageId: `err-${Date.now()}`,
    };
    dispatchedEmailsLog.unshift(failedRecord);

    return {
      success: false,
      error: err.message || 'Dispatch error',
    };
  }
}

/**
 * Sends a real live test email to verify credentials and inbox delivery
 */
export async function testSmtpConnection(targetEmail?: string): Promise<{ success: boolean; message: string; messageId?: string; previewUrl?: string }> {
  const recipient = (targetEmail || dynamicSmtpConfig.user || dynamicSmtpConfig.fromEmail || 'commersgyan@gmail.com').trim();

  if (!dynamicSmtpConfig.user || !dynamicSmtpConfig.pass) {
    return {
      success: false,
      message: 'SMTP credentials missing. Please enter your Gmail address and 16-character App Password to test live email delivery.',
    };
  }

  try {
    const { transporter, fromAddress } = await getTransporter();

    // Verify handshake first
    await transporter.verify();

    // Send test email
    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject: `TsuKURI_3D Studio - Live Tax Invoice Test Dispatch`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #1e4b3e; border-radius: 16px; padding: 24px; background: #ffffff;">
          <h2 style="color: #1e4b3e; margin-top: 0;">✓ Real Email Delivery Verified!</h2>
          <p style="color: #475569; font-size: 14px;">This test confirms that TsuKURI_3D Studio is connected to <strong>${dynamicSmtpConfig.host || 'Gmail SMTP'}</strong>.</p>
          <p style="color: #475569; font-size: 14px;">All future customer tax invoices and order dispatch receipts will be delivered directly to customer email addresses (including ${recipient}).</p>
          <div style="background: #e8ece1; padding: 12px; border-radius: 8px; font-size: 12px; color: #1e4b3e; font-weight: bold;">
            Sender: ${fromAddress}<br/>
            Recipient: ${recipient}<br/>
            Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </div>
        </div>
      `,
    });

    return {
      success: true,
      message: `Test email successfully delivered to ${recipient}! Check your inbox.`,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error('[ServerMailer] Test email failed:', err);
    return {
      success: false,
      message: `Failed to deliver test email: ${err.message || 'SMTP Authentication error'}. Please verify your App Password and ensure 2-Step Verification is enabled in Google Account.`,
    };
  }
}

/**
 * Builds Kyoto craft styled tax invoice HTML
 */
export function buildTaxInvoiceEmailHtml(params: {
  customerName: string;
  orderNumber: string;
  customerEmail?: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  paymentMethod: string;
  shippingAddress: string;
  deliveryEta?: string;
  items: Array<{
    productName: string;
    quantity: number;
    totalPrice: number;
  }>;
}): string {
  const {
    customerName,
    orderNumber,
    totalAmount,
    subtotal,
    taxAmount,
    shippingFee,
    paymentMethod,
    shippingAddress,
    deliveryEta = '3 to 4 Days Pan-India Express',
    items,
  } = params;

  const itemsListHtml = (items || [])
    .map(
      (it) => `<tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e8ece1; font-family: sans-serif;">
          <strong style="color: #1a2e26; font-size: 13px;">${it.productName || '3D Craft Model'}</strong>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">100% Bio-Matte PLA · 0.12mm Precision Layers · Solar Crafted</div>
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e8ece1; text-align: center; font-weight: bold; color: #1e4b3e;">${it.quantity}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e8ece1; text-align: right; font-weight: bold; font-family: monospace;">₹${Number(it.totalPrice).toLocaleString('en-IN')}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order #${orderNumber} - Tax Invoice</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f0; color: #1a2e26; margin: 0; padding: 24px 12px; line-height: 1.5;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 3px solid #1e4b3e; box-shadow: 0 12px 40px rgba(30, 75, 62, 0.12);">
    <div style="background: #1e4b3e; color: #ffffff; padding: 30px 24px; text-align: center;">
      <div style="display: inline-block; width: 54px; height: 54px; background: #ffffff; color: #1e4b3e; border-radius: 18px; font-size: 26px; font-weight: bold; line-height: 54px; margin-bottom: 10px; border: 2px solid #f3b755;">造</div>
      <h1 style="color: #f3b755; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 0.5px;">TSUKURI_3D STUDIO</h1>
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.85); margin-top: 4px; font-weight: 700;">KYOTO × NUSANTARA 3D FABRICATION LAB</div>
    </div>
    <div style="padding: 24px 28px;">
      <h2 style="color: #1e4b3e; font-size: 20px; margin: 0 0 8px;">Konnichiwa, ${customerName}! 🌿</h2>
      <p style="font-size: 13px; color: #475569; margin: 0 0 16px;">
        Thank you for commissioning your 3D craft piece with <strong>TsuKURI_3D Studio</strong>. Your 3D models have entered our high-speed solar-powered print queue with 0.12mm precision layers. Here is your official commission tax invoice and dispatch receipt.
      </p>
      <div style="background: #e8ece1; border-radius: 16px; padding: 14px 18px; margin-bottom: 16px; border: 1px solid rgba(30,75,62,0.15);">
        <table style="width: 100%; font-size: 12px;">
          <tr>
            <td><strong style="color: #1e4b3e;">Order Number:</strong> #${orderNumber}</td>
            <td style="text-align: right;"><strong style="color: #1e4b3e;">Payment:</strong> ${paymentMethod}</td>
          </tr>
        </table>
      </div>
      <div style="background: #f3b755; color: #1a2e26; border-radius: 14px; padding: 10px 16px; font-size: 12px; font-weight: bold; margin-bottom: 20px;">
        🚚 Standard Delivery in ${deliveryEta} (Tracking active on dispatch)
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
        <thead>
          <tr style="background: #1e4b3e; color: #f3b755;">
            <th style="padding: 10px 14px; text-align: left; font-size: 11px;">ITEM DESCRIPTION</th>
            <th style="padding: 10px 14px; text-align: center; font-size: 11px;">QTY</th>
            <th style="padding: 10px 14px; text-align: right; font-size: 11px;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 18px; margin-bottom: 20px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #64748b;">
          <span>Subtotal:</span>
          <span style="font-family: monospace;">₹${Number(subtotal).toLocaleString('en-IN')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #64748b;">
          <span>Shipping Fee:</span>
          <span style="font-family: monospace;">${shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #64748b;">
          <span>CGST (9%) + SGST (9%):</span>
          <span style="font-family: monospace;">₹${Number(taxAmount).toLocaleString('en-IN')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #1e4b3e; border-top: 2px solid #1e4b3e; padding-top: 8px; margin-top: 6px;">
          <span>TOTAL PAID / PAYABLE:</span>
          <span>₹${Number(totalAmount).toLocaleString('en-IN')}</span>
        </div>
      </div>
      <div style="background: #e8ece1; border-radius: 14px; padding: 12px 16px; font-size: 11px; margin-bottom: 20px;">
        <strong style="color: #1e4b3e;">Shipping Destination:</strong><br />
        <span style="color: #1a2e26; font-weight: 600;">${customerName}</span><br />
        <span style="color: #475569;">${shippingAddress}</span>
      </div>
      <div style="text-align: center; padding: 16px; background: #ffffff; border-radius: 16px; border: 2px dashed #1e4b3e;">
        <h4 style="margin: 0 0 4px; color: #1e4b3e; font-size: 14px;">Official Studio Support</h4>
        <p style="font-size: 11px; color: #64748b; margin: 0 0 10px;">
          Need assistance or live order tracking? Our Support team is at your service.
        </p>
        <span style="display: inline-block; background: #1e4b3e; color: #f3b755; padding: 8px 18px; border-radius: 999px; font-size: 11px; font-weight: bold;">
          SUPPORT ASSISTANCE
        </span>
      </div>
    </div>
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 10px; color: #64748b;">
      <p style="margin: 0;"><strong>TsuKURI_3D Studio · Solar Print Microgrid</strong></p>
      <p style="margin: 2px 0 0;">Plot 42, HSR Layout Sector 1, Bengaluru · GSTIN: 29AABCT3921Z1Z8</p>
      <p style="margin: 2px 0 0;">Official Studio Support</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Automates sending order invoice to customer email id
 */
export async function autoDispatchOrderInvoice(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  paymentMethod: string;
  shippingAddress: string;
  deliveryEta?: string;
  items: Array<{
    productName: string;
    quantity: number;
    totalPrice: number;
  }>;
}) {
  const { customerEmail, customerName, orderNumber, totalAmount } = params;

  if (!customerEmail) {
    console.warn(`[ServerMailer] autoDispatchOrderInvoice skipped: No customer email for #${orderNumber}`);
    return { success: false, error: 'No customer email provided' };
  }

  const html = buildTaxInvoiceEmailHtml(params);
  return sendBackendInvoiceEmail({
    to: customerEmail,
    customerName,
    orderNumber,
    totalAmount,
    emailHTML: html,
  });
}
