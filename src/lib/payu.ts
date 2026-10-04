import crypto from 'crypto';

export interface PayUPaymentRequest {
  txnid: string;
  amount: string; // formatted with 2 decimal places e.g. "599.00"
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PayUConfig {
  merchantKey: string;
  merchantSalt: string;
  env: 'test' | 'prod';
}

export function getPayUConfig(): PayUConfig {
  return {
    merchantKey: process.env.PAYU_MERCHANT_KEY || 'GTKFFx', // standard PayU test key
    merchantSalt: process.env.PAYU_MERCHANT_SALT || 'eCwWELxi', // standard PayU test salt
    env: (process.env.PAYU_ENV as 'test' | 'prod') || 'test',
  };
}

export function getPayUActionUrl(env: 'test' | 'prod'): string {
  return env === 'prod'
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';
}

/**
 * PayU SHA-512 Payment Request Hash Formula:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
export function generatePayUHash(params: PayUPaymentRequest, salt: string, key: string): string {
  const {
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
  } = params;

  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  return crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
}

/**
 * PayU SHA-512 Response Hash Formula (Reverse Hash):
 * sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * Or with additionalcharge:
 * sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayUResponseHash(responseBody: any, salt: string, key: string): boolean {
  const {
    status,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    hash,
    additionalCharges,
  } = responseBody;

  let reverseHashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

  if (additionalCharges) {
    reverseHashString = `${additionalCharges}|${reverseHashString}`;
  }

  const calculatedHash = crypto.createHash('sha512').update(reverseHashString).digest('hex').toLowerCase();
  return calculatedHash === String(hash).toLowerCase();
}
