import {
  processShadowfaxWebhook,
  getShadowfaxConfig,
} from '../../src/lib/shadowfax.ts';

// Helper to collect raw body buffer in Vercel serverless environment
async function getRawBody(req: any): Promise<Buffer> {
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return Buffer.from(JSON.stringify(req.body), 'utf-8');
  }
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export default async function handler(req: any, res: any) {
  // 1. Diagnostic / Verification GET request (Used by Shadowfax and merchant ping)
  if (req.method === 'GET') {
    const config = getShadowfaxConfig();
    return res.status(200).json({
      name: 'Tsukuri3D',
      service: 'Tsukuri3D Shadowfax Express Logistics Webhook Listener',
      partnerName: config.partnerName,
      status: 'ACTIVE_AND_READY',
      endpoint: '/api/webhooks/shadowfax',
      method: 'POST',
      contentType: 'application/json',
      supportedEvents: [
        'ORDER_CREATED',
        'MANIFESTED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'RTO_INITIATED',
        'RTO_DELIVERED',
        'CANCELLED',
      ],
      stagingDetails: {
        clientPushUrl: 'https://tsukuri3d.vercel.app/api/webhooks/shadowfax',
        authorisationPresent: 'No',
      },
      productionDetails: {
        clientPushUrl: 'https://tsukuri3d.vercel.app/api/webhooks/shadowfax',
        authorisationPresent: 'No',
        integrationType: 'Forward Logistics',
      },
      samplePayload: {
        awb_number: 'SFX1248256501',
        client_order_id: 'TSU-1001',
        current_status: 'IN_TRANSIT',
        location: 'Bengaluru Sorting Hub',
        remarks: 'Shipment handed over to Shadowfax courier',
      },
    });
  }

  // 2. Incoming POST webhook notification from Shadowfax
  if (req.method === 'POST') {
    try {
      const config = getShadowfaxConfig();

      const validTokens = [
        config.productionToken,
        config.webhookSecret,
        'a6a05ac9ce3595a4b1461d07fd83363e1f32d32d',
      ].filter(Boolean);

      const incomingHeader = req.headers['authorization'] || '';
      const incomingSecret =
        req.headers['x-shadowfax-token'] ||
        req.headers['x-api-key'] ||
        req.headers['x-secret-key'] ||
        incomingHeader.replace(/^Bearer\s+/i, '').replace(/^Token\s+/i, '').trim() ||
        req.query?.secret ||
        req.query?.token;

      if (incomingSecret && !validTokens.includes(incomingSecret)) {
        return res.status(401).json({
          status: false,
          error: 'Unauthorized: Invalid Shadowfax webhook token',
        });
      }

      let payload = req.body;
      if (!payload || typeof payload !== 'object') {
        const rawBuf = await getRawBody(req);
        try {
          payload = JSON.parse(rawBuf.toString('utf-8'));
        } catch {
          payload = {};
        }
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
      const result = await processShadowfaxWebhook(payload, {
        ip: clientIp,
        headers: req.headers,
      });

      return res.status(200).json({
        status: true,
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Shadowfax serverless webhook handler error:', err);
      return res.status(200).json({
        status: false,
        error: err.message || 'Webhook processing failed',
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
