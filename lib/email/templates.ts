interface PurchaseEmailProps {
  customerName: string;
  productName: string;
  productSummary: string;
  downloadUrl: string;
  whatsappNumber: string;
}

export function getPurchaseEmailTemplate({ customerName, productName, productSummary, downloadUrl, whatsappNumber }: PurchaseEmailProps): string {
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>¡Gracias por tu compra!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header with gradient and logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                  <img src="https://planetaketo.es/LOGO.png" alt="Planeta Keto" style="max-width: 120px; height: auto; margin-bottom: 16px;" />
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    ¡Gracias por tu compra, ${customerName}!
                  </h1>
                  <p style="margin: 12px 0 0 0; color: #d1fae5; font-size: 16px;">
                    Tu transformación comienza ahora
                  </p>
                </td>
              </tr>

              <!-- Main content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Estamos emocionados de acompañarte en tu viaje hacia una vida más saludable. Has dado el primer paso y eso es lo más importante.
                  </p>

                  <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 22px 24px; margin: 24px 0; border-radius: 12px;">
                    <p style="margin: 0 0 6px 0; color: #059669; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
                      📥 Tu compra
                    </p>
                    <h2 style="margin: 0 0 8px 0; color: #065f46; font-size: 20px; font-weight: bold; line-height: 1.25;">
                      ${productName}
                    </h2>
                    ${productSummary ? `<p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.55;">${productSummary}</p>` : ''}
                  </div>

                  <!-- Download Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 9999px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                          ⬇️ Descargar mi libro
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0; color: #6b7280; font-size: 14px; text-align: center;">
                    Este enlace es permanente y te permite 2 descargas
                  </p>

                  <!-- Divider -->
                  <div style="border-top: 2px solid #e5e7eb; margin: 32px 0;"></div>

                  <!-- Support Section -->
                  <div style="text-align: center; margin: 32px 0;">
                    <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; font-weight: 600;">
                      ¿Tienes dudas o necesitas soporte?
                    </p>
                    <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
                      Estamos aquí para ayudarte en cada paso del camino
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${whatsappUrl}" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 16px;">
                            💬 Contactar por WhatsApp
                          </a>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Tips Section -->
                  <div style="background-color: #fef3c7; padding: 24px; border-radius: 12px; margin: 32px 0;">
                    <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px; font-weight: bold;">
                      💡 Consejos para empezar
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
                      <li>Descarga el PDF y guárdalo en un lugar seguro</li>
                      <li>Lee la introducción para entender los fundamentos</li>
                      <li>Comienza con las recetas más sencillas</li>
                      <li>Usa las calculadoras para personalizar tu plan</li>
                      <li>No dudes en contactarnos si tienes preguntas</li>
                    </ul>
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                    Gracias por confiar en Planeta Keto
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © 2025 Planeta Keto. Todos los derechos reservados.
                  </p>
                  <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: #10b981; text-decoration: none;">planetaketo.es</a>
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
