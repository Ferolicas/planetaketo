# Lead Magnet Setup Guide - Planeta Keto

This guide will help you set up the complete lead magnet funnel for the free 7-day keto plan.

## 📋 Overview

**New Landing Page:** `planetaketo.es/r`

The page offers two options:
- **FREE**: Opens modal → Captures name/email → Sends immediate email with PDF → Schedules 4 follow-up emails
- **PAID**: Redirects to home page (existing Fourthwall purchase flow)

## 🗄️ Step 1: Create Supabase Table

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `ibyeukzocqygimmwibxe`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `supabase/migrations/create_leads_table.sql`
6. Paste into the SQL editor
7. Click "Run" to execute

### Option B: Using Local SQL

```bash
# Connect to your database
psql postgresql://postgres:Buil0517ABC@db.ibyeukzocqygimmwibxe.supabase.co:5432/postgres

# Run the migration file
\i supabase/migrations/create_leads_table.sql
```

### Verify Table Creation

Run this query in Supabase SQL Editor:

```sql
SELECT * FROM public.leads LIMIT 5;
```

You should see an empty table with columns: `id`, `email`, `name`, `created_at`

## 📧 Step 2: Configure Resend Email

### Verify Domain in Resend

1. Go to Resend Dashboard: https://resend.com/domains
2. Check if `planetaketo.es` is verified
3. If not verified, add the domain and complete DNS verification:
   - Add the provided DNS records to your domain registrar
   - Wait for verification (usually takes 5-30 minutes)

### Update From Email (if needed)

If `noreply@planetaketo.es` is not available, you can use:
- `hola@planetaketo.es`
- Or any other verified email address

Update in `.env.local`:

```env
RESEND_FROM_EMAIL=your-verified-email@planetaketo.es
```

## 📄 Step 3: Upload PDF to Supabase Storage

### Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new public bucket called `lead-magnets`
3. Upload your "Plan Keto de 7 Días" PDF file
4. Make the bucket public:
   - Click on the bucket
   - Go to "Policies" tab
   - Create a new policy for public read access:

```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'lead-magnets' );
```

### Get PDF Public URL

1. After uploading, click on the PDF file
2. Click "Get URL" or "Copy URL"
3. You'll get a URL like:
   ```
   https://ibyeukzocqygimmwibxe.supabase.co/storage/v1/object/public/lead-magnets/plan-keto-7-dias.pdf
   ```

### Update Environment Variable

Edit `.env.local` and replace the placeholder URL:

```env
LEAD_MAGNET_PDF_URL=https://ibyeukzocqygimmwibxe.supabase.co/storage/v1/object/public/lead-magnets/plan-keto-7-dias.pdf
```

## 🚀 Step 4: Deploy and Test

### Restart Development Server

```bash
npm run dev
```

### Test the Complete Flow

1. **Visit the landing page:**
   - Navigate to: http://localhost:3000/r
   - You should see the two-option layout

2. **Test Free Option (Lead Magnet):**
   - Click "DESCARGAR GRATIS" button
   - Modal should open
   - Fill in name and email
   - Click "DESCARGAR GRATIS"
   - Success message should appear
   - Check your email inbox for Email 1

3. **Verify Database:**
   - Go to Supabase Dashboard → Table Editor → `leads`
   - Your test email should be in the table

4. **Verify Resend:**
   - Go to Resend Dashboard: https://resend.com/emails
   - You should see:
     - 1 email sent (Email 1 - immediate)
     - 4 emails scheduled (Emails 2-5)

5. **Test Paid Option:**
   - Click "COMPRAR - 10€" button
   - Should redirect to home page (/)
   - Payment modal should work as usual

## 🔍 Step 5: Verify Email Sequence

### Check Email Schedule in Resend

In the Resend dashboard (https://resend.com/emails):

1. **Email 1** - ✅ Sent immediately
   - Subject: "Tu Plan Keto de 7 Días está aquí 🥑"
   - Status: Delivered

2. **Email 2** - ⏰ Scheduled for Day 2
   - Subject: "El error #1 que arruina la dieta keto"
   - Status: Scheduled

3. **Email 3** - ⏰ Scheduled for Day 4
   - Subject: "¿Cómo vas con el plan? (día 3-4)"
   - Status: Scheduled

4. **Email 4** - ⏰ Scheduled for Day 7
   - Subject: "Ya terminaste los 7 días... ¿y ahora qué?"
   - Status: Scheduled

5. **Email 5** - ⏰ Scheduled for Day 9
   - Subject: "(última vez) Sobre el método de 70 días"
   - Status: Scheduled

## 📊 Monitoring and Analytics

### View Leads in Supabase

```sql
-- Get all leads
SELECT * FROM public.leads ORDER BY created_at DESC;

-- Count total leads
SELECT COUNT(*) as total_leads FROM public.leads;

-- Leads by day
SELECT
  DATE(created_at) as signup_date,
  COUNT(*) as signups
FROM public.leads
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;
```

### Check Email Delivery in Resend

1. Go to Resend Dashboard
2. Click on "Emails" in the sidebar
3. Filter by:
   - Status (Delivered, Scheduled, Failed)
   - Date range
   - Recipient email

## ⚙️ Configuration Files Reference

### Environment Variables (.env.local)

```env
# Resend Configuration
RESEND_API_KEY=re_A6HrRhHz_D5YMsGF2ZT9mTZTDv63vYKWM
RESEND_FROM_EMAIL=noreply@planetaketo.es

# Lead Magnet PDF URL
LEAD_MAGNET_PDF_URL=https://your-pdf-url-here.pdf
```

### Email Templates

Located in: `lib/email/lead-templates.ts`

- `getEmail1Template()` - Welcome + PDF download
- `getEmail2Template()` - Value + first sales touch (Day 2)
- `getEmail3Template()` - Keto flu tips + connection (Day 4)
- `getEmail4Template()` - Direct sales pitch (Day 7)
- `getEmail5Template()` - Final email + last CTA (Day 9)

## 🐛 Troubleshooting

### Email 1 not received?

1. Check spam/promotions folder
2. Verify Resend domain is verified
3. Check Resend dashboard for delivery status
4. Verify `RESEND_FROM_EMAIL` in `.env.local`

### Emails not scheduled?

1. Check Resend API logs for errors
2. Verify scheduled emails in Resend dashboard
3. Check server console logs for errors
4. Ensure dates are in the future (ISO 8601 format)

### Lead not saved in database?

1. Check browser console for errors
2. Verify Supabase table exists: `SELECT * FROM leads;`
3. Check API logs in terminal
4. Verify RLS policies allow inserts

### Modal not opening?

1. Check browser console for errors
2. Verify React state is working
3. Test with React DevTools

### PDF link broken?

1. Verify PDF is uploaded to Supabase Storage
2. Check bucket is public
3. Verify `LEAD_MAGNET_PDF_URL` is correct
4. Test URL directly in browser

## 📝 Testing Checklist

- [ ] Supabase `leads` table created
- [ ] Resend domain verified
- [ ] PDF uploaded to Supabase Storage
- [ ] `LEAD_MAGNET_PDF_URL` environment variable updated
- [ ] Development server restarted
- [ ] Landing page loads at `/r`
- [ ] Free option modal opens
- [ ] Form validation works
- [ ] Email 1 received immediately
- [ ] Lead saved in Supabase
- [ ] Emails 2-5 scheduled in Resend
- [ ] Paid option redirects to home
- [ ] Payment flow works normally

## 🚢 Production Deployment

### Before Deploying to Production:

1. **Update Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add/update:
     ```
     RESEND_FROM_EMAIL=noreply@planetaketo.es
     LEAD_MAGNET_PDF_URL=https://[your-production-pdf-url]
     ```

2. **Verify Domain in Resend:**
   - Ensure `planetaketo.es` is verified for production use
   - Test sending from `noreply@planetaketo.es`

3. **Test in Production:**
   - After deployment, test the complete flow on `planetaketo.es/r`
   - Use a real email address to verify delivery

4. **Monitor:**
   - Check Supabase for new leads
   - Monitor Resend for email delivery status
   - Set up alerts for failed emails

## 📧 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review server logs in terminal/Vercel
3. Check Supabase logs
4. Check Resend dashboard for email status

---

**Created:** December 2024
**Version:** 1.0
**Status:** Ready for production
