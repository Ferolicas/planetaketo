import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function createMagicLink(customerId: string, paymentId: string, fileName: string) {
  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');

  // Create download link in database
  const { data, error } = await supabaseAdmin
    .from('download_links')
    .insert({
      customer_id: customerId,
      payment_id: paymentId,
      token,
      file_name: fileName,
      download_count: 0,
      max_downloads: 2,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating magic link:', error);
    throw error;
  }

  // Generate the download URL
  const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/download/${token}`;

  return {
    token: data.token,
    downloadUrl,
  };
}

export async function validateAndIncrementDownload(token: string) {
  // Get download link
  const { data: link, error } = await supabaseAdmin
    .from('download_links')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !link) {
    return { valid: false, error: 'Invalid download link' };
  }

  // Check if download limit reached
  if (link.download_count >= link.max_downloads) {
    return { valid: false, error: 'Download limit reached' };
  }

  // Increment download count
  const { error: updateError } = await supabaseAdmin
    .from('download_links')
    .update({
      download_count: link.download_count + 1,
      last_download_at: new Date().toISOString(),
    })
    .eq('id', link.id);

  if (updateError) {
    return { valid: false, error: 'Error updating download count' };
  }

  return {
    valid: true,
    fileName: link.file_name,
    remainingDownloads: link.max_downloads - (link.download_count + 1),
  };
}
