import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Verifying Razorpay payment...');

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing required payment parameters');
    }

    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret not configured');
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(razorpayKeySecret);
    const messageData = encoder.encode(text);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = expectedSignature === razorpay_signature;

    console.log('Payment verification result:', isValid);

    if (isValid) {
      // Get user from auth header
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          const planStartDate = new Date();
          const planExpiryDate = new Date();
          planExpiryDate.setMonth(planExpiryDate.getMonth() + 1);

          // Insert subscription details
          const { error: subscriptionError } = await supabase
            .from('details_of_subscribed_user')
            .insert({
              user_id: user.id,
              email: user.email || '',
              plan_name: 'Pro',
              payment_id: razorpay_payment_id,
              plan_start_date: planStartDate.toISOString().split('T')[0],
              plan_expiry_date: planExpiryDate.toISOString().split('T')[0]
            });

          if (subscriptionError) {
            console.error('Error inserting subscription details:', subscriptionError);
          } else {
            console.log('Subscription details saved for user:', user.id);
          }

          // Update user role to subscribed_user
          await supabase
            .from('profiles')
            .update({
              role: 'subscribed_user',
              plan: 'pro',
              plan_status: 'active',
              plan_expiry: planExpiryDate.toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

          // Update user_roles table
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', user.id);

          await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'subscribed_user'
            });

          console.log('User role updated to subscribed_user for user:', user.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: isValid,
        payment_id: razorpay_payment_id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
