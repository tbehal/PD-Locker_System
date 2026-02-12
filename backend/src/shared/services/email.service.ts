/**
 * Shared Email Service
 * Handles all email sending functionality
 * Supports AWS SES SDK (primary) and SMTP via Nodemailer (fallback)
 */
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { format } from 'date-fns'

type EmailTransportType = 'ses' | 'smtp' | 'none'

let smtpTransporter: Transporter | null = null
let sesClient: SESv2Client | null = null
let transportType: EmailTransportType = 'none'
let transportInitialized = false

function initTransport(): void {
  if (transportInitialized) return
  transportInitialized = true

  // Priority 1: AWS SES SDK (uses IAM credentials directly)
  const accessKey = process.env.ACCESS_KEY
  const secretKey = process.env.SECRET_ACCESS_KEY
  const region = process.env.AWS_REGION || 'us-east-1'

  if (accessKey && secretKey) {
    sesClient = new SESv2Client({
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    })
    transportType = 'ses'
    console.log(`[Email Service] Using AWS SES SDK transport (region: ${region})`)
    return
  }

  // Priority 2: SMTP transport
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
    transportType = 'smtp'
    console.log('[Email Service] Using SMTP transport')
    return
  }

  console.log('[Email Service] No email transport configured (need AWS credentials or SMTP credentials)')
}

interface SendMailOptions {
  from: string
  to: string
  subject: string
  html: string
  text: string
}

async function sendMail(options: SendMailOptions): Promise<boolean> {
  initTransport()

  if (transportType === 'ses' && sesClient) {
    console.log(`[Email Service] Sending via SES: from=${options.from} to=${options.to} subject="${options.subject}"`)
    const command = new SendEmailCommand({
      FromEmailAddress: options.from,
      Destination: { ToAddresses: [options.to] },
      Content: {
        Simple: {
          Subject: { Data: options.subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: options.html, Charset: 'UTF-8' },
            Text: { Data: options.text, Charset: 'UTF-8' },
          },
        },
      },
    })
    const result = await sesClient.send(command)
    console.log(`[Email Service] SES response: MessageId=${result.MessageId}, status=${result.$metadata.httpStatusCode}`)
    return true
  }

  if (transportType === 'smtp' && smtpTransporter) {
    await smtpTransporter.sendMail(options)
    return true
  }

  return false
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
  initTransport()
  if (transportType === 'none') return false

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
    await sendMail({
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
  initTransport()
  if (transportType === 'none') return false

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
    await sendMail({
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
  initTransport()
  if (transportType === 'none') return false

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
    await sendMail({
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

interface AdminLockerAvailableParams {
  lockerNumber: string
  previousRenterName: string | null
  previousRenterEmail: string | null
  waitlistCount: number
}

export async function sendAdminLockerAvailableEmail(params: AdminLockerAvailableParams): Promise<boolean> {
  initTransport()
  if (transportType === 'none') return false

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.log('ADMIN_EMAIL not configured, skipping admin notification')
    return false
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4173'

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Karla', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 6px 6px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 6px 6px; }
    .details { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .alert { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .btn { display: inline-block; background-color: #0660B2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Locker Now Available</h1>
  </div>
  <div class="content">
    <p>A locker has become available and can be assigned to someone on the waitlist.</p>

    <div class="details">
      <div class="detail-row">
        <strong>Locker Number:</strong> #${params.lockerNumber}
      </div>
      ${params.previousRenterName ? `
      <div class="detail-row">
        <strong>Previous Renter:</strong> ${params.previousRenterName} (${params.previousRenterEmail || 'N/A'})
      </div>
      ` : ''}
    </div>

    ${params.waitlistCount > 0 ? `
    <div class="alert">
      <strong>Waitlist Alert:</strong> There ${params.waitlistCount === 1 ? 'is' : 'are'} <strong>${params.waitlistCount}</strong> ${params.waitlistCount === 1 ? 'person' : 'people'} on the waitlist waiting for a locker.
    </div>
    ` : ''}

    <div style="text-align: center;">
      <a href="${frontendUrl}/admin/dashboard" class="btn">Go to Admin Dashboard</a>
    </div>
  </div>
  <div class="footer">
    <p>Prep Doctors - Locker Management System</p>
  </div>
</body>
</html>
`

  const textBody = `
Locker Now Available - Prep Doctors

A locker has become available and can be assigned to someone on the waitlist.

Locker Number: #${params.lockerNumber}
${params.previousRenterName ? `Previous Renter: ${params.previousRenterName} (${params.previousRenterEmail || 'N/A'})` : ''}

${params.waitlistCount > 0 ? `WAITLIST ALERT: There ${params.waitlistCount === 1 ? 'is' : 'are'} ${params.waitlistCount} ${params.waitlistCount === 1 ? 'person' : 'people'} on the waitlist.` : ''}

Go to Admin Dashboard: ${frontendUrl}/admin/dashboard

Prep Doctors - Locker Management System
`

  try {
    await sendMail({
      from: getFromEmail(),
      to: adminEmail,
      subject: `Locker #${params.lockerNumber} Now Available - ${params.waitlistCount} on Waitlist`,
      html: htmlBody,
      text: textBody,
    })
    console.log(`[Email Service] Admin notification sent for locker #${params.lockerNumber}`)
    return true
  } catch (error) {
    console.error('Failed to send admin locker available email:', error)
    return false
  }
}

interface KeyDepositRefundParams {
  studentName: string
  studentEmail: string
  lockerNumber: string
  startDate: string
  endDate: string
  depositAmount: number
}

export async function sendKeyDepositRefundEmail(params: KeyDepositRefundParams): Promise<boolean> {
  initTransport()
  if (transportType === 'none') return false

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.log('ADMIN_EMAIL not configured, skipping refund request notification')
    return false
  }

  const formattedStartDate = format(new Date(params.startDate), 'MMMM d, yyyy')
  const formattedEndDate = format(new Date(params.endDate), 'MMMM d, yyyy')
  const formattedAmount = `$${params.depositAmount.toFixed(2)}`

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Karla', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 6px 6px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 6px 6px; }
    .details { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Key Deposit Refund Request</h1>
  </div>
  <div class="content">
    <p>A key deposit refund has been requested for the following student. Please initiate the refund through finance.</p>

    <div class="details">
      <div class="detail-row">
        <strong>Student Name:</strong> ${params.studentName}
      </div>
      <div class="detail-row">
        <strong>Student Email:</strong> ${params.studentEmail}
      </div>
      <div class="detail-row">
        <strong>Locker Number:</strong> #${params.lockerNumber}
      </div>
      <div class="detail-row">
        <strong>Rental Period:</strong> ${formattedStartDate} - ${formattedEndDate}
      </div>
      <div class="detail-row">
        <strong>Deposit Amount:</strong> ${formattedAmount}
      </div>
    </div>
  </div>
  <div class="footer">
    <p>Prep Doctors - Locker Management System</p>
  </div>
</body>
</html>
`

  const textBody = `
Key Deposit Refund Request - Prep Doctors

A key deposit refund has been requested for the following student.

Student Name: ${params.studentName}
Student Email: ${params.studentEmail}
Locker Number: #${params.lockerNumber}
Rental Period: ${formattedStartDate} - ${formattedEndDate}
Deposit Amount: ${formattedAmount}

Please initiate the refund through finance.

Prep Doctors - Locker Management System
`

  try {
    await sendMail({
      from: getFromEmail(),
      to: adminEmail,
      subject: `Key Deposit Refund Request - Locker #${params.lockerNumber} - ${params.studentName}`,
      html: htmlBody,
      text: textBody,
    })
    console.log(`[Email Service] Key deposit refund request sent for ${params.studentName} (Locker #${params.lockerNumber})`)
    return true
  } catch (error) {
    console.error('Failed to send key deposit refund email:', error)
    return false
  }
}
