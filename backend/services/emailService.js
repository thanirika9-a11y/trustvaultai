const nodemailer = require('nodemailer');

// We cache the transporter so we only create the Ethereal test account once
let transporter = null;

/**
 * Returns a ready-to-use transporter.
 * - If Gmail credentials are in .env → uses Gmail (real delivery)
 * - Otherwise → auto-creates a free Ethereal test account (preview link printed to terminal)
 */
const getTransporter = async () => {
  // Dynamically re-read .env to get the latest credentials without server reboot
  try {
    require('dotenv').config({ override: true });
  } catch (_) {}

  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : null;

  if (user && pass) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  if (transporter) return transporter;

  // Auto-create a free Ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log('📧 Email service: Using Ethereal (test mode)');
  return transporter;
};

// ─── OTP Email ────────────────────────────────────────────────────────────────
const sendOTP = async (email, otp) => {
  try {
    const t = await getTransporter();
    const sender = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'noreply@trustvault.ai';

    const info = await t.sendMail({
      from: `"TrustVault AI" <${sender}>`,
      to: email,
      subject: 'Your TrustVault Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #ffffff; border-radius: 12px; padding: 32px;">
          <h2 style="color: #7C3AED; margin-bottom: 8px;">TrustVault AI</h2>
          <p style="color: #94a3b8; margin-bottom: 24px;">Your email verification code:</p>
          <div style="background: #1e293b; border: 2px solid #7C3AED; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #7C3AED;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">This code expires in <strong style="color:#fff">10 minutes</strong>. Do not share it with anyone.</p>
        </div>
      `,
    });

    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    return false;
  }
};

// ─── Share Notification Email ──────────────────────────────────────────────────
const sendShareNotification = async ({ recipientEmail, senderName, documentTitle, isRegistered }) => {
  try {
    const t = await getTransporter();
    const sender = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'noreply@trustvault.ai';

    const registerNote = isRegistered
      ? 'Log in to TrustVault to view the shared document in your vault.'
      : 'Create a free TrustVault account to access the document shared with you.';

    const ctaText = isRegistered ? 'View Document' : 'Create Account & View';

    const info = await t.sendMail({
      from: `"TrustVault AI" <${sender}>`,
      to: recipientEmail,
      subject: `${senderName} shared a document with you on TrustVault`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; color: #ffffff; border-radius: 12px; padding: 32px;">
          <h2 style="color: #7C3AED; margin-bottom: 4px;">TrustVault AI</h2>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 0;">Secure Document Vault</p>
          
          <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #7C3AED;">
            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px;">Shared by</p>
            <p style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: #ffffff;">${senderName}</p>
            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px;">Document</p>
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #7C3AED;">${documentTitle}</p>
          </div>

          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">${registerNote}</p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="http://localhost:8082" style="background: #7C3AED; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">${ctaText}</a>
          </div>
        </div>
      `,
    });

    console.log(`✅ Share notification sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending share notification:', error.message);
    return false;
  }
};

// ─── Password Reset Email ──────────────────────────────────────────────────
const sendPasswordReset = async (email, otp) => {
  try {
    const t = await getTransporter();
    const sender = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'noreply@trustvault.ai';

    const info = await t.sendMail({
      from: `"TrustVault AI" <${sender}>`,
      to: email,
      subject: 'Reset Your TrustVault Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #ffffff; border-radius: 12px; padding: 32px;">
          <h2 style="color: #7C3AED; margin-bottom: 8px;">TrustVault AI</h2>
          <p style="color: #94a3b8; margin-bottom: 24px;">Your password reset code:</p>
          <div style="background: #1e293b; border: 2px solid #7C3AED; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #7C3AED;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">This code expires in <strong style="color:#fff">10 minutes</strong>.</p>
        </div>
      `,
    });

    console.log(`✅ Password Reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    return false;
  }
};

// ─── Family Invite Notification Email ─────────────────────────────────────────
const sendFamilyInviteNotification = async ({ recipientEmail, senderName, memberName, relation }) => {
  try {
    const t = await getTransporter();
    const sender = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'noreply@trustvault.ai';

    const info = await t.sendMail({
      from: `"TrustVault AI" <${sender}>`,
      to: recipientEmail,
      subject: `${senderName} added you as a Family Member (${relation}) on TrustVault`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; color: #ffffff; border-radius: 12px; padding: 32px;">
          <h2 style="color: #7C3AED; margin-bottom: 4px;">TrustVault AI</h2>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 0;">Family Circle & Vault Protection</p>
          
          <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #7C3AED;">
            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px;">Added by</p>
            <p style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: #ffffff;">${senderName}</p>
            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px;">Relation</p>
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #7C3AED;">${relation} (${memberName})</p>
          </div>

          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">You have been added to ${senderName}'s Family Circle on TrustVault.</p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="http://localhost:8082" style="background: #7C3AED; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Access TrustVault</a>
          </div>
        </div>
      `,
    });

    console.log(`✅ Family invite email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending family invite email:', error.message);
    return false;
  }
};

// ─── Document Deadline / EMI / Expiry Notification Email ───────────────────────
const sendDeadlineNotification = async ({ recipientEmail, title, dueDate, amountDue, reminderType, reminderNote }) => {
  try {
    const t = await getTransporter();
    const sender = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'noreply@trustvault.ai';
    const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Soon';

    const info = await t.sendMail({
      from: `"TrustVault AI" <${sender}>`,
      to: recipientEmail,
      subject: `⏰ Reminder: ${reminderType || 'Upcoming Deadline'} for ${title} (${formattedDate})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; color: #ffffff; border-radius: 12px; padding: 32px;">
          <h2 style="color: #7C3AED; margin-bottom: 4px;">TrustVault AI</h2>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 0;">Smart Deadline & Payment Reminder</p>
          
          <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #F59E0B;">
            <p style="margin: 0 0 8px; color: #F59E0B; font-weight: bold; font-size: 14px;">⏰ ${reminderType || 'Payment / Expiry Due'}</p>
            <p style="margin: 0 0 12px; font-size: 18px; font-weight: bold; color: #ffffff;">${title}</p>
            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px;">Due / Expiry Date</p>
            <p style="margin: 0 0 12px; font-size: 16px; font-weight: bold; color: #10B981;">📅 ${formattedDate}</p>
            ${amountDue ? `
              <p style="margin: 0 0 4px; color: #94a3b8; font-size: 13px;">Estimated Amount</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #F59E0B;">💰 ${amountDue}</p>
            ` : ''}
          </div>

          ${reminderNote ? `<p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; background: rgba(124, 58, 237, 0.1); padding: 12px 16px; border-radius: 8px;">ℹ️ ${reminderNote}</p>` : ''}

          <p style="color: #94a3b8; font-size: 13px;">TrustVault AI will proactively notify you to prevent late fees or lapsed coverage.</p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="http://localhost:8082" style="background: #7C3AED; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">View in Vault</a>
          </div>
        </div>
      `,
    });

    console.log(`✅ Deadline notification email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending deadline notification email:', error.message);
    return false;
  }
};

module.exports = { 
  sendOTP, 
  sendShareNotification, 
  sendPasswordReset, 
  sendFamilyInviteNotification,
  sendDeadlineNotification 
};
