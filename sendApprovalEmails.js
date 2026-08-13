/**
 * sendApprovalEmails.js
 * ---------------------------------------------------------
 * One-time bulk mailer: sends the Membership Approval + Payment
 * email to ALL students whose application status is 'approved'.
 *
 * "Only once" guarantee:
 *   Each student is marked with `approvalEmailSent: true` in the DB
 *   right after their email goes out successfully. Re-running this
 *   script will skip anyone already flagged, so nobody gets a
 *   duplicate mail. No existing files are changed.
 *
 * Google "abnormal activity" safety:
 *   - Uses Gmail SMTP with STARTTLS (port 587)
 *   - Sends strictly one at a time (sequential)
 *   - Waits a RANDOM delay (default 3-3.5 mins) between emails
 *   - Rate cap per run so you stay well under Gmail limits
 *   - Stops safely on repeated failures and lets you resume later
 *
 * Usage:
 *   node sendApprovalEmails.js                     # send for real
 *   node sendApprovalEmails.js --dry-run           # preview only, no mails
 *
 * Optional env vars (add to .env or pass inline):
 *   DELAY_MIN_MS=180000
 *   DELAY_MAX_MS=210000
 *   MAX_EMAILS_PER_RUN=100
 *   APPROVAL_EMAIL_SUBJECT="Your SEMI Membership is Approved"
 */

require('dotenv').config();

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { getMembershipApprovedNoPaymentTemplate } = require('./utils/emailTemplateApprovedNoPayment');

// ---------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------
const DRY_RUN = process.argv.includes('--dry-run');

const DELAY_MIN_MS = parseInt(process.env.DELAY_MIN_MS, 10) || 180000; // 3 minutes
const DELAY_MAX_MS = parseInt(process.env.DELAY_MAX_MS, 10) || 210000; // 3.5 minutes
const MAX_EMAILS_PER_RUN = parseInt(process.env.MAX_EMAILS_PER_RUN, 10) || 100;
const SUBJECT = process.env.APPROVAL_EMAIL_SUBJECT || 'Membership Application Approved - SEMI';

// Emails already successfully mailed (from the previous run). These are
// skipped so nobody gets a duplicate mail.
const ALREADY_EMAILED = [
  'smrutitaware2024@gmail.com',
  'anitha.silvery@gmail.com',
  'dr.abhisheksinghkshatri@gmail.com',
  'drmadan93@gmail.com',
  'dr.sornajaa@outlook.com',
  'dr.silvery.anith@esic.gov.in',
  'VIVEKRABADIYA89@GMAIL.COM',
  'sabarirajant16@gmail.com',
  'libania95@gmail.com',
  'aamirbadar@gmail.com',
  'dr.ranadeepg@gmail.com',
  'michellelionel@gmail.com',
  'shivachandran181294@gmail.com',
  'Nitin.Jagasia@uhs.nhs.uk',
  'shravan.surgeon@gmail.com',
  'doctor.tirthankar@gmail.com',
  'ankur@intensivist.com',
  'shivavarun505@gmail.com',
  'smrutihnair@gmail.com',
  'drdeepu.goarla@gmail.com',
  'benbabu63@gmail.com',
  'DRUMARMATHEEN@GMAIL.COM',
  'umarazmed@gmail.com',
  'adarshwilson7007@gmail.com',
];

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const randomDelay = () =>
  Math.floor(DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS));

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
};

// ---------------------------------------------------------------
// Transporter
// ---------------------------------------------------------------
function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    pool: false, // sequential, single connection per send
  });
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function main() {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('ERROR: EMAIL_USER / EMAIL_PASS not set in .env');
    process.exit(1);
  }

  log(`Connecting to MongoDB: ${process.env.MONGO_URI}`);
  await mongoose.connect(process.env.MONGO_URI);
  log('DB connected.');

  const Membership = mongoose.model(
    'Membership',
    require('./models/Membership').schema
  );

  const pending = await Membership.find({
    status: 'approved',
    approvalEmailSent: { $ne: true },
    email: { $nin: ALREADY_EMAILED },
  }).lean();

  const alreadySent = await Membership.countDocuments({ approvalEmailSent: true });

  log(`Approved students found: ${pending.length} | already emailed before: ${alreadySent} | skipped by hardcoded list: ${ALREADY_EMAILED.length}`);
  log(`Will process up to: ${MAX_EMAILS_PER_RUN} this run | dry-run mode: ${DRY_RUN ? 'YES' : 'NO'}`);
  log(`Delay between mails: ${DELAY_MIN_MS}-${DELAY_MAX_MS}ms`);

  if (pending.length === 0) {
    log('Nothing to send. All approved students already emailed.');
    process.exit(0);
  }

  const batch = pending.slice(0, MAX_EMAILS_PER_RUN);

  if (DRY_RUN) {
    log('--- DRY RUN: would email these students ---');
    batch.forEach((m) => log(`  ${m.email}  (${m.fullName})`));
    log('Dry run complete. No emails sent.');
    process.exit(0);
  }

  const transporter = createTransporter();

  // Verify SMTP once up front so we fail fast instead of mid-way
  try {
    await transporter.verify();
    log('SMTP connection verified. Ready to send.');
  } catch (err) {
    console.error('ERROR: SMTP verification failed:', err.message);
    process.exit(1);
  }

  let sent = 0;
  let failed = 0;
  let consecutiveFailures = 0;

  for (let i = 0; i < batch.length; i++) {
    const m = batch[i];

    const html = getMembershipApprovedNoPaymentTemplate(
      m.fullName,
      null
    );

    try {
      await transporter.sendMail({
        from: `"Society for Emergency Medicine India" <${SMTP_USER}>`,
        to: m.email,
        subject: SUBJECT,
        html,
      });

      // Only mark as sent AFTER a successful delivery
      await Membership.updateOne(
        { _id: m._id },
        { $set: { approvalEmailSent: true, approvalEmailSentAt: new Date() } }
      );

      sent++;
      consecutiveFailures = 0;
      log(`OK  [${i + 1}/${batch.length}] ${m.email} (${m.fullName})`);

      // Don't wait after the last mail
      if (i < batch.length - 1) {
        const delay = randomDelay();
        log(`    waiting ${(delay / 1000).toFixed(1)}s before next...`);
        await sleep(delay);
      }
    } catch (err) {
      failed++;
      consecutiveFailures++;
      console.error(`FAIL [${i + 1}/${batch.length}] ${m.email}: ${err.message}`);

      // If Gmail is throttling/flagging, stop early so the account isn't blocked.
      if (consecutiveFailures >= 3) {
        console.error(
          'ERROR: 3 consecutive failures. Stopping to protect the Gmail account.\n' +
          'Run this script again later — unsent students will be picked up automatically.'
        );
        break;
      }
    }
  }

  log('----------------------------------------');
  log(`SUMMARY: sent=${sent} failed=${failed} (from ${batch.length} attempted)`);
  log(`Total approved already emailed now: ${alreadySent + sent}`);
  log(DRY_RUN ? 'Dry run - no emails were actually sent.' : 'Bulk mail run finished.');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error('Fatal error:', err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
