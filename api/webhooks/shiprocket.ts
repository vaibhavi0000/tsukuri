import {
  processShiprocketWebhook,
  getShiprocketConfig,
} from '../../src/lib/shiprocket.ts';

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
  // 1. Diagnostic / Verification GET request
  if (req.method === 'GET') {
    const config = getShiprocketConfig();
    return res.status(200).json({
      name: 'Tsukuri3D',
      service: 'Tsukuri3D Shiprocket Logistics Webhook Listener',
      channelName: config.channelName,
      communicationBrandName: config.communicationBrandName,
      channelId: config.channelId,
      status: 'ACTIVE_AND_READY',
      endpoint: '/api/webhooks/shiprocket',
      method: 'POST',
      contentType: 'application/json',
      supportedEvents: [
        'AWB_ASSIGNED',
        'PICKUP_SCHEDULED',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'RTO_INITIATED',
        'RTO_DELIVERED',
      ],
      samplePayload: {
        awb: 'SR1248256501',
        order_id: 'TSU-1001',
        current_status: 'IN_TRANSIT',
        location: 'Bengaluru Sorting Hub',
        remarks: 'Shipment handed over to courier partner',
        courier_name: 'Shiprocket Express',
      },
    });
  }

  // 2. Incoming POST webhook notification from Shiprocket
  if (req.method === 'POST') {
    try {
      const config = getShiprocketConfig();

      if (config.requireSecret && config.webhookSecret) {
        const incomingSecret =
          req.headers['x-shiprocket-token'] ||
          req.headers['x-api-key'] ||
          req.headers['x-secret-key'] ||
          req.headers['authorization']?.replace('Bearer ', '') ||
          req.query?.secret ||
          req.query?.token;

        if (incomingSecret !== config.webhookSecret) {
          return res.status(401).json({
            status: false,
            error: 'Unauthorized: Invalid Shiprocket webhook secret token',
          });
        }
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
      const result = await processShiprocketWebhook(payload, {
        ip: clientIp,
        headers: req.headers,
      });

      return res.status(200).json({
        status: true,
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Shiprocket serverless webhook handler error:', err);
      return res.status(200).json({
        status: false,
        error: err.message || 'Webhook processing failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
