export type SindiPayCredentials = {
  merchantId: string;
  apiKey: string;
  apiSecret: string;
};

export type SindiPayCreatePaymentInput = {
  amount: number;
  currency: string;
  orderId: number;
  description?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  callbackUrl?: string;
  webhookUrl?: string;
};

export type SindiPayCreatePaymentResult = {
  providerRef: string;
  paymentUrl?: string;
  raw: any;
};

function getEnv(name: string, fallback = ""): string {
  const v = String(process.env[name] ?? "").trim();
  return v.length > 0 ? v : fallback;
}

function joinUrl(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function sindiPayCreatePayment(
  creds: SindiPayCredentials,
  input: SindiPayCreatePaymentInput
): Promise<SindiPayCreatePaymentResult> {
  const baseUrl = getEnv("SINDIPAY_BASE_URL");
  if (!baseUrl) {
    throw new Error("SINDIPAY_BASE_URL is not configured");
  }

  const path = getEnv("SINDIPAY_CREATE_PAYMENT_PATH", "/payments");
  const url = joinUrl(baseUrl, path);

  const apiKeyHeader = getEnv("SINDIPAY_API_KEY_HEADER", "x-api-key");
  const apiSecretHeader = getEnv("SINDIPAY_API_SECRET_HEADER", "x-api-secret");
  const merchantHeader = getEnv("SINDIPAY_MERCHANT_ID_HEADER", "x-merchant-id");

  const payload: any = {
    amount: input.amount,
    currency: input.currency,
    orderId: input.orderId,
    description: input.description ?? `Order #${input.orderId}`,
    customer: input.customer ?? undefined,
    callbackUrl: input.callbackUrl ?? undefined,
    webhookUrl: input.webhookUrl ?? undefined,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [apiKeyHeader]: creds.apiKey,
      [apiSecretHeader]: creds.apiSecret,
      [merchantHeader]: creds.merchantId,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const errMsg = typeof data === "string" ? data : JSON.stringify(data ?? {});
    throw new Error(`SindiPay create payment failed (${res.status}): ${errMsg}`);
  }

  const providerRef =
    String(
      (data as any)?.paymentId ??
        (data as any)?.id ??
        (data as any)?.reference ??
        (data as any)?.ref ??
        ""
    ).trim() || `order:${input.orderId}`;

  const paymentUrl =
    (typeof (data as any)?.paymentUrl === "string" && (data as any).paymentUrl) ||
    (typeof (data as any)?.url === "string" && (data as any).url) ||
    (typeof (data as any)?.checkoutUrl === "string" && (data as any).checkoutUrl) ||
    undefined;

  return { providerRef, paymentUrl, raw: data };
}
