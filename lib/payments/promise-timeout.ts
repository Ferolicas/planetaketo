export class PaymentConfirmationTimeoutError extends Error {
  constructor() {
    super('payment_confirmation_timeout');
    this.name = 'PaymentConfirmationTimeoutError';
  }
}

/**
 * Impide que una promesa de confirmación deje el checkout bloqueado para
 * siempre. No cancela el cobro remoto: los webhooks siguen siendo la fuente de
 * verdad y completan la entrega si el banco confirma después del timeout.
 */
export async function withPaymentConfirmationTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new PaymentConfirmationTimeoutError()), timeoutMs);
  });

  try {
    return await Promise.race([promise, timedOut]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
