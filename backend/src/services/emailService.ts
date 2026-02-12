import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { format } from 'date-fns'

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (transporter) {
    return transporter
  }

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.log('SMTP not configured, email sending disabled')
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  return transporter
}

function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'no-reply@prepdoctors.com'
}

interface PaymentLinkEmailParams {
  to: string
  studentName: string
  lockerNumber: string
  startDate: string
  endDate: string
  totalAmount: number
  paymentUrl: string
}

export async function sendPaymentLinkEmail(params: PaymentLinkEmailParams): Promise<boolean> {
  const transport = getTransporter()
  if (!transport) return false

  const formattedStartDate = format(new Date(params.startDate), 'MMMM d, yyyy')
  const formattedEndDate = format(new Date(params.endDate), 'MMMM d, yyyy')
  const formattedAmount = `$${(params.totalAmount / 100).toFixed(2)}`

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Karla', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0660B2; color: white; padding: 20px; text-align: center; border-radius: 6px 6px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 6px 6px; }
    .details { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .btn { display: inline-block; background-color: #0660B2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Complete Your Locker Reservation</h1>
  </div>
  <div class="content">
    <p>Hi ${params.studentName},</p>
    <p>Thank you for choosing Prep Doctors for your locker rental. Please complete your payment to confirm your reservation.</p>

    <div class="details">
      <div class="detail-row">
        <span><strong>Locker Number:</strong></span>
        <span>#${params.lockerNumber}</span>
      </div>
      <div class="detail-row">
        <span><strong>Start Date:</strong></span>
        <span>${formattedStartDate}</span>
      </div>
      <div class="detail-row">
        <span><strong>End Date:</strong></span>
        <span>${formattedEndDate}</span>
      </div>
      <div class="detail-row">
        <span><strong>Total Amount:</strong></span>
        <span>${formattedAmount}</span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${params.paymentUrl}" class="btn">Complete Payment</a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">This payment link will expire in 24 hours. If you have any questions, please contact us.</p>
  </div>
  <div class="footer">
    <p>Prep Doctors - Medical Education Center</p>
  </div>
</body>
</html>
`

  const textBody = `
Complete Your Locker Reservation - Prep Doctors

Hi ${params.studentName},

Thank you for choosing Prep Doctors for your locker rental. Please complete your payment to confirm your reservation.

Reservation Details:
- Locker Number: #${params.lockerNumber}
- Start Date: ${formattedStartDate}
- End Date: ${formattedEndDate}
- Total Amount: ${formattedAmount}

Complete your payment here: ${params.paymentUrl}

This payment link will expire in 24 hours.

Prep Doctors - Medical Education Center
`

  try {
    await transport.sendMail({
      from: getFromEmail(),
      to: params.to,
      subject: 'Complete Your Locker Reservation - Prep Doctors',
      html: htmlBody,
      text: textBody,
    })
    return true
  } catch (error) {
    console.error('Failed to send payment link email:', error)
    return false
  }
}

interface WelcomeEmailParams {
  to: string
  studentName: string
  lockerNumber: string
  startDate: string
  endDate: string
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> {
  const transport = getTransporter()
  if (!transport) return false

  const formattedStartDate = format(new Date(params.startDate), 'MMMM d, yyyy')
  const formattedEndDate = format(new Date(params.endDate), 'MMMM d, yyyy')

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Karla', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0660B2; color: white; padding: 20px; text-align: center; border-radius: 6px 6px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 6px 6px; }
    .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
    .details { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .instructions { background-color: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Your Locker is Ready!</h1>
  </div>
  <div class="content">
    <div class="success-icon">&#9989;</div>
    <p>Hi ${params.studentName},</p>
    <p>Great news! Your locker reservation has been confirmed. Your locker is now ready for use.</p>

    <div class="details">
      <div class="detail-row">
        <span><strong>Locker Number:</strong></span>
        <span>#${params.lockerNumber}</span>
      </div>
      <div class="detail-row">
        <span><strong>Rental Period:</strong></span>
        <span>${formattedStartDate} - ${formattedEndDate}</span>
      </div>
    </div>

    <div class="instructions">
      <h3 style="margin-top: 0; color: #059669;">Key Pickup Instructions</h3>
      <p style="margin-bottom: 0;">Please visit the <strong>front desk</strong> during business hours to collect your locker key. Bring a valid ID for verification.</p>
    </div>

    <p>If you have any questions about your locker or need assistance, please don't hesitate to contact us.</p>
  </div>
  <div class="footer">
    <p>Prep Doctors - Medical Education Center</p>
  </div>
</body>
</html>
`

  const textBody = `
Your Locker is Ready! - Prep Doctors

Hi ${params.studentName},

Great news! Your locker reservation has been confirmed. Your locker is now ready for use.

Reservation Details:
- Locker Number: #${params.lockerNumber}
- Rental Period: ${formattedStartDate} - ${formattedEndDate}

Key Pickup Instructions:
Please visit the front desk during business hours to collect your locker key. Bring a valid ID for verification.

If you have any questions, please contact us.

Prep Doctors - Medical Education Center
`

  try {
    await transport.sendMail({
      from: getFromEmail(),
      to: params.to,
      subject: 'Your Locker is Ready! - Prep Doctors',
      html: htmlBody,
      text: textBody,
    })
    return true
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return false
  }
}

interface ExpiryReminderEmailParams {
  to: string
  studentName: string
  lockerNumber: string
  endDate: string
}

export async function sendExpiryReminderEmail(params: ExpiryReminderEmailParams): Promise<boolean> {
  const transport = getTransporter()
  if (!transport) return false

  const formattedEndDate = format(new Date(params.endDate), 'MMMM d, yyyy')
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4173'

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Karla', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 6px 6px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 6px 6px; }
    .warning-icon { font-size: 48px; text-align: center; margin: 20px 0; }
    .details { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .instructions { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .btn { display: inline-block; background-color: #0660B2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Your Locker Rental Ends Tomorrow</h1>
  </div>
  <div class="content">
    <div class="warning-icon">&#9888;</div>
    <p>Hi ${params.studentName},</p>
    <p>This is a friendly reminder that your locker rental is ending tomorrow.</p>

    <div class="details">
      <p><strong>Locker Number:</strong> #${params.lockerNumber}</p>
      <p><strong>End Date:</strong> ${formattedEndDate}</p>
    </div>

    <div class="instructions">
      <h3 style="margin-top: 0; color: #b45309;">Important Reminders</h3>
      <ul style="margin-bottom: 0;">
        <li>Please return your locker key to the <strong>front desk</strong> by end of day tomorrow.</li>
        <li>Remove all personal belongings from your locker.</li>
        <li>If you need to extend your rental, please book a new reservation.</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${frontendUrl}/lockers" class="btn">Renew Your Locker</a>
    </div>
  </div>
  <div class="footer">
    <p>Prep Doctors - Medical Education Center</p>
  </div>
</body>
</html>
`

  const textBody = `
Your Locker Rental Ends Tomorrow - Prep Doctors

Hi ${params.studentName},

This is a friendly reminder that your locker rental is ending tomorrow.

Details:
- Locker Number: #${params.lockerNumber}
- End Date: ${formattedEndDate}

Important Reminders:
- Please return your locker key to the front desk by end of day tomorrow.
- Remove all personal belongings from your locker.
- If you need to extend your rental, please book a new reservation at ${frontendUrl}/lockers

Prep Doctors - Medical Education Center
`

  try {
    await transport.sendMail({
      from: getFromEmail(),
      to: params.to,
      subject: 'Your Locker Rental Ends Tomorrow - Prep Doctors',
      html: htmlBody,
      text: textBody,
    })
    return true
  } catch (error) {
    console.error('Failed to send expiry reminder email:', error)
    return false
  }
}
