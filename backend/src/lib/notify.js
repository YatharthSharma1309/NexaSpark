/**
 * Best-effort notifications (Phase C — email flows).
 * When SMTP is not configured, events are logged as structured JSON.
 */

/**
 * @param {{ email: string; name?: string }} user
 * @param {import('../models/Order.js').default} order
 */
export async function notifyOrderConfirmed(user, order) {
  const payload = {
    type: 'order_confirmed',
    to: user.email,
    orderId: order._id?.toString(),
    totalAmount: order.totalAmount,
    currency: order.currency,
    smtpConfigured: Boolean(process.env.SMTP_HOST),
  };

  if (!process.env.SMTP_HOST) {
    console.log(JSON.stringify({ ...payload, channel: 'log' }));
    return;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@nexaspark.local',
      to: user.email,
      subject: `NexaSpark order ${order._id.toString().slice(-8)}`,
      text: `Thanks for your order. Total: ${order.currency} ${order.totalAmount}.`,
    });
    console.log(JSON.stringify({ ...payload, channel: 'smtp', ok: true }));
  } catch (err) {
    console.error(
      JSON.stringify({
        ...payload,
        channel: 'smtp',
        ok: false,
        err: err instanceof Error ? err.message : String(err),
      })
    );
  }
}
