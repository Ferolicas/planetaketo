/**
 * Email templates for lead magnet email sequence
 * 5-email sequence sent over 9 days
 */

interface EmailTemplateParams {
  name: string;
  pdfUrl?: string;
  fourthwallUrl?: string;
  youtubeUrl?: string;
}

/**
 * EMAIL 1: Lead Magnet Delivery (Immediate)
 * Delivers the 7-day keto plan PDF
 */
export function getEmail1Template({ name, pdfUrl }: EmailTemplateParams): string {
  const downloadUrl = pdfUrl || 'https://planetaketo.es/download'; // Fallback URL

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Plan Keto de 7 Días</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border-radius: 8px 8px 0 0;">
              <img src="https://planetaketo.es/LOGO.png" alt="Planeta Keto" style="max-width: 180px; height: auto;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #111827;">¡Hola${name ? ' ' + name : ''}!</h2>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Gracias por descargar el <strong>Plan Keto de 7 Días</strong>.
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;">
                Aquí está tu descarga:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${downloadUrl}" style="display: inline-block; padding: 16px 32px; background-color: #16a34a; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                      📥 DESCARGAR PLAN DE 7 DÍAS
                    </a>
                  </td>
                </tr>
              </table>

              <div style="padding: 16px; background-color: #fef3c7; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>⚠️ Importante:</strong> Este enlace es personal y solo puede usarse una vez. Valido por 7 dias.
                </p>
              </div>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Te recomiendo:
              </p>

              <ol style="margin: 0 0 24px; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li>Descargarlo ahora mismo</li>
                <li>Revisar la lista de compras</li>
                <li>Empezar mañana con el Día 1</li>
              </ol>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Durante los próximos días te enviaré algunos tips que te ayudarán a sacarle el máximo provecho al plan.
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;">
                Si tienes dudas, responde a este email.
              </p>

              <p style="margin: 0 0 8px; font-size: 16px; line-height: 24px; color: #374151;">
                ¡A por ello!
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #111827; font-weight: 600;">
                Planeta Keto
              </p>

              <div style="padding: 20px; background-color: #f3f4f6; border-radius: 6px; margin-top: 32px;">
                <p style="margin: 0 0 8px; font-size: 14px; line-height: 20px; color: #6b7280;">
                  <strong>P.D.</strong> Si quieres ver más recetas keto, te espero en mi canal:
                </p>
                <a href="https://youtube.com/@planetaketo" style="color: #16a34a; text-decoration: none; font-weight: 600;">
                  📺 YouTube @planetaketo
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                © ${new Date().getFullYear()} Planeta Keto. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * EMAIL 2: Value + First Sales Touch (Day 2)
 * Provides value while introducing the paid product
 */
export function getEmail2Template({ name, fourthwallUrl }: EmailTemplateParams): string {
  const productUrl = fourthwallUrl || 'https://planetaketo.es';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>El error #1 que arruina la dieta keto</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border-radius: 8px 8px 0 0;">
              <img src="https://planetaketo.es/LOGO.png" alt="Planeta Keto" style="max-width: 180px; height: auto;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #111827;">¡Hola${name ? ' ' + name : ''}!</h2>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                ¿Ya empezaste con el plan de 7 días?
              </p>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Hoy quiero hablarte del error más común que veo:
              </p>

              <div style="padding: 24px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; margin: 24px 0;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #92400e;">
                  COMER DEMASIADA PROTEÍNA Y POCA GRASA
                </p>
              </div>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Mucha gente piensa que keto es "comer carne sin límite", pero no es así.
              </p>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                En keto, la grasa es tu combustible principal (70-75% de tus calorías).<br>
                La proteína debe ser moderada (20-25%).<br>
                Los carbohidratos, mínimos (5-10%).
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;">
                Si comes demasiada proteína, tu cuerpo la convierte en glucosa (se llama gluconeogénesis) y sales de cetosis.
              </p>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                <strong>Mi consejo:</strong> Añade más grasa a tus comidas.
              </p>

              <ul style="margin: 0 0 24px; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li>Más aguacate</li>
                <li>Más aceite de oliva</li>
                <li>Más mantequilla</li>
                <li>Queso con todo</li>
              </ul>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                En el plan de 7 días las recetas ya están balanceadas, pero si adaptas otras recetas, ten esto en cuenta.
              </p>

              <div style="padding: 24px; background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; margin: 32px 0; text-align: center;">
                <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                  ¿Quieres el método completo de 70 días con todo balanceado?
                </p>
                <a href="${productUrl}" style="display: inline-block; padding: 16px 32px; background-color: #16a34a; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                  Ver Método de 70 Días
                </a>
              </div>

              <p style="margin: 0 0 8px; font-size: 16px; line-height: 24px; color: #374151;">
                Mañana te cuento otro tip importante.
              </p>

              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #111827; font-weight: 600;">
                Planeta Keto
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                © ${new Date().getFullYear()} Planeta Keto. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * EMAIL 3: Useful Content + Connection (Day 4)
 * Helps with keto flu and builds relationship
 */
export function getEmail3Template({ name }: EmailTemplateParams): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¿Cómo vas con el plan?</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border-radius: 8px 8px 0 0;">
              <img src="https://planetaketo.es/LOGO.png" alt="Planeta Keto" style="max-width: 180px; height: auto;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #111827;">¡Hola${name ? ' ' + name : ''}!</h2>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Si empezaste el lunes, ya vas por el día 3 o 4.
              </p>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Puede que estés sintiendo:
              </p>

              <ul style="margin: 0 0 24px; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li>Menos hambre entre comidas</li>
                <li>Más energía (o todavía cansancio, es normal los primeros días)</li>
                <li>Quizás dolor de cabeza leve</li>
              </ul>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Si sientes dolor de cabeza o cansancio, es la <strong>"gripe keto"</strong>. Tu cuerpo está adaptándose.
              </p>

              <div style="padding: 24px; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px; margin: 24px 0;">
                <p style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #1e40af;">
                  LA SOLUCIÓN: Más sal y más agua.
                </p>
                <p style="margin: 0; font-size: 16px; line-height: 24px; color: #1e40af;">
                  En serio. Cuando entras en cetosis, tu cuerpo elimina mucho líquido y con él, electrolitos. Añade más sal a tus comidas y bebe 2-3 litros de agua al día.
                </p>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;">
                En 2-3 días pasará y te sentirás mejor que nunca.
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;">
                Ánimo, lo peor ya casi pasa.
              </p>

              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #111827; font-weight: 600;">
                Planeta Keto
              </p>

              <div style="padding: 20px; background-color: #f3f4f6; border-radius: 6px; margin-top: 32px;">
                <p style="margin: 0 0 8px; font-size: 14px; line-height: 20px; color: #6b7280;">
                  <strong>P.D.</strong> ¿Sabías que en mi método de 70 días incluyo una guía completa de cómo manejar la gripe keto y todos los efectos secundarios?
                </p>
                <a href="https://planetaketo.es" style="color: #16a34a; text-decoration: none; font-weight: 600;">
                  Más info aquí →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                © ${new Date().getFullYear()} Planeta Keto. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * EMAIL 4: Direct Sale (Day 7)
 * Main sales pitch after completing the 7-day plan
 */
export function getEmail4Template({ name, fourthwallUrl }: EmailTemplateParams): string {
  const productUrl = fourthwallUrl || 'https://planetaketo.es';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ya terminaste los 7 días... ¿y ahora qué?</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border-radius: 8px 8px 0 0;">
              <img src="https://planetaketo.es/LOGO.png" alt="Planeta Keto" style="max-width: 180px; height: auto;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #111827;">¡Hola${name ? ' ' + name : ''}!</h2>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Si seguiste el plan, hoy es tu día 7.
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;">
                Felicidades. En serio. La mayoría de la gente ni siquiera empieza, y tú ya completaste una semana entera.
              </p>

              <p style="margin: 0 0 16px; font-size: 18px; line-height: 28px; color: #111827; font-weight: 600;">
                Ahora viene la pregunta importante:
              </p>

              <div style="padding: 24px; background-color: #fef3c7; border-radius: 8px; margin: 24px 0; text-align: center;">
                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #92400e;">
                  ¿Qué haces mañana?
                </p>
              </div>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Tienes dos opciones:
              </p>

              <div style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 6px; margin: 24px 0;">
                <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #991b1b;">
                  OPCIÓN 1: Improvisar
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 20px; color: #991b1b;">
                  Buscar recetas por tu cuenta, calcular macros, planificar menús... Es posible, pero la mayoría pierde motivación en 2-3 semanas.
                </p>
              </div>

              <div style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 6px; margin: 24px 0;">
                <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #166534;">
                  OPCIÓN 2: Seguir un plan estructurado
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 20px; color: #166534;">
                  Como el que acabas de hacer, pero durante 70 días completos.
                </p>
              </div>

              <p style="margin: 0 0 16px; font-size: 18px; line-height: 24px; color: #111827; font-weight: 600;">
                Mi Método de 70 Días incluye:
              </p>

              <ul style="margin: 0 0 24px; padding-left: 24px; font-size: 16px; line-height: 32px; color: #374151;">
                <li>✓ 70 días de menús (no tienes que pensar qué comer)</li>
                <li>✓ Más de 100 recetas paso a paso</li>
                <li>✓ Listas de compras semanales</li>
                <li>✓ Plan de transición al terminar (para no recuperar el peso)</li>
                <li>✓ Guía de errores comunes</li>
              </ul>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Las personas que lo siguen pierden en promedio <strong>8-12 kg</strong>.
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;">
                Y cuesta solo <strong style="color: #16a34a; font-size: 20px;">10€</strong>.
              </p>

              <p style="margin: 0 0 32px; font-size: 14px; line-height: 20px; color: #6b7280; text-align: center;">
                Menos que una pizza a domicilio.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${productUrl}" style="display: inline-block; padding: 20px 40px; background-color: #16a34a; color: #ffffff; text-decoration: none; font-size: 18px; font-weight: 700; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      QUIERO EL MÉTODO COMPLETO
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151; text-align: center;">
                Tú ya probaste que puedes hacerlo. Ahora solo necesitas el plan completo.
              </p>

              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #111827; font-weight: 600;">
                Planeta Keto
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                © ${new Date().getFullYear()} Planeta Keto. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * EMAIL 5: Last Email + Close (Day 9)
 * Final touch with personal story and last CTA
 */
export function getEmail5Template({ name, fourthwallUrl, youtubeUrl }: EmailTemplateParams): string {
  const productUrl = fourthwallUrl || 'https://planetaketo.es';
  const channelUrl = youtubeUrl || 'https://youtube.com/@planetaketo';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>(última vez) Sobre el método de 70 días</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); border-radius: 8px 8px 0 0;">
              <img src="https://planetaketo.es/LOGO.png" alt="Planeta Keto" style="max-width: 180px; height: auto;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #111827;">¡Hola${name ? ' ' + name : ''}!</h2>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Este es el último email que te envío sobre el método de 70 días.
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;">
                Si no te interesa, lo entiendo perfectamente. No te volveré a escribir sobre esto.
              </p>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Pero antes de cerrar, quiero contarte <strong>por qué lo creé</strong>:
              </p>

              <div style="padding: 24px; background-color: #f3f4f6; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                  Después de años haciendo recetas keto en YouTube, veía el mismo patrón una y otra vez:
                </p>
                <p style="margin: 0; font-size: 16px; line-height: 24px; color: #374151; font-style: italic;">
                  La gente empezaba motivada, hacía 2-3 recetas... y desaparecía.
                </p>
              </div>

              <p style="margin: 0 0 16px; font-size: 18px; line-height: 28px; color: #111827; font-weight: 600;">
                ¿Por qué? Porque les faltaba ESTRUCTURA.
              </p>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                No basta con tener recetas. Necesitas:
              </p>

              <ul style="margin: 0 0 24px; padding-left: 24px; font-size: 16px; line-height: 28px; color: #374151;">
                <li>Saber qué comer cada día</li>
                <li>No tener que pensar ni planificar</li>
                <li>Variedad para no aburrirte</li>
                <li>Un plan claro de principio a fin</li>
              </ul>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                Por eso creé el método de 70 días.
              </p>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;">
                <strong>70 días</strong> porque es el tiempo que toma crear un hábito real.<br>
                Y porque en ese tiempo se ven resultados serios (8-12 kg).
              </p>

              <p style="margin: 0 0 32px; font-size: 16px; line-height: 24px; color: #374151;">
                Si lo que te frenó hasta ahora fue no saber por dónde seguir, este es tu camino.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${productUrl}" style="display: inline-block; padding: 20px 40px; background-color: #16a34a; color: #ffffff; text-decoration: none; font-size: 18px; font-weight: 700; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      VER MÉTODO DE 70 DÍAS
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px; font-size: 14px; line-height: 20px; color: #6b7280; text-align: center;">
                Solo 10€. Sin trucos, sin suscripciones, sin upsells.
              </p>

              <div style="height: 1px; background-color: #e5e7eb; margin: 32px 0;"></div>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;">
                Te deseo lo mejor con tu camino keto, sigas o no el método.
              </p>

              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #111827; font-weight: 600;">
                Planeta Keto
              </p>

              <div style="padding: 20px; background-color: #f3f4f6; border-radius: 6px; margin-top: 32px;">
                <p style="margin: 0 0 8px; font-size: 14px; line-height: 20px; color: #6b7280;">
                  <strong>P.D.</strong> Si decides no comprarlo, igual puedes seguir viendo mis recetas gratis en YouTube:
                </p>
                <a href="${channelUrl}" style="color: #16a34a; text-decoration: none; font-weight: 600;">
                  📺 YouTube @planetaketo
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                © ${new Date().getFullYear()} Planeta Keto. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
