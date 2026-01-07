import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, action, otp: userOtp } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone format. Use E.164 format (e.g., +1234567890)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !twilioPhone) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send') {
      // Check rate limiting - max 3 OTP requests per phone per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentRequests } = await supabaseAdmin
        .from('otp_verifications')
        .select('created_at')
        .eq('phone', phone)
        .gte('created_at', oneHourAgo);

      if (recentRequests && recentRequests.length >= 3) {
        return new Response(
          JSON.stringify({ error: 'Too many OTP requests. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

      // Store OTP in database (upsert to handle existing records)
      const { error: upsertError } = await supabaseAdmin
        .from('otp_verifications')
        .upsert({
          phone,
          otp,
          expires_at: expiresAt,
          attempts: 0,
          verified: false,
          verified_at: null
        }, { onConflict: 'phone' });

      if (upsertError) {
        console.error('Failed to store OTP:', upsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate OTP' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send SMS via Twilio
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const credentials = btoa(`${accountSid}:${authToken}`);

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: twilioPhone,
          Body: `Your CIMS verification code is: ${otp}. Valid for 5 minutes.`,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Twilio error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to send OTP' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`OTP sent to ${phone}`);
      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'verify') {
      if (!userOtp) {
        return new Response(
          JSON.stringify({ error: 'OTP is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get stored OTP from database
      const { data: record, error: fetchError } = await supabaseAdmin
        .from('otp_verifications')
        .select('*')
        .eq('phone', phone)
        .single();

      if (fetchError || !record) {
        return new Response(
          JSON.stringify({ error: 'No OTP found for this number. Please request a new one.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if too many attempts
      if (record.attempts >= 5) {
        return new Response(
          JSON.stringify({ error: 'Too many failed attempts. Please request a new OTP.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      if (new Date() > new Date(record.expires_at)) {
        // Delete expired OTP
        await supabaseAdmin
          .from('otp_verifications')
          .delete()
          .eq('phone', phone);

        return new Response(
          JSON.stringify({ error: 'OTP has expired. Please request a new one.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify OTP
      if (record.otp !== userOtp) {
        // Increment attempts
        await supabaseAdmin
          .from('otp_verifications')
          .update({ attempts: record.attempts + 1 })
          .eq('phone', phone);

        return new Response(
          JSON.stringify({ error: 'Invalid OTP' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // OTP verified - mark as verified and delete
      await supabaseAdmin
        .from('otp_verifications')
        .update({ 
          verified: true, 
          verified_at: new Date().toISOString() 
        })
        .eq('phone', phone);

      // Clean up verified OTP
      await supabaseAdmin
        .from('otp_verifications')
        .delete()
        .eq('phone', phone);

      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
