import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      organization_id, 
      update_type, 
      update_data, 
      location_ids 
    } = await req.json()

    if (!organization_id || !update_type || !update_data || !location_ids) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Create bulk update record
    const { data: bulkUpdate, error: bulkError } = await supabaseClient
      .from('gmb_bulk_updates')
      .insert({
        organization_id,
        update_type,
        update_data,
        target_locations: location_ids,
        total_locations: location_ids.length,
        status: 'processing',
        created_by: req.headers.get('X-User-ID'),
      })
      .select()
      .single()

    if (bulkError) {
      throw new Error(`Failed to create bulk update: ${bulkError.message}`)
    }

    // Get locations with their account tokens
    const { data: locations, error: locationsError } = await supabaseClient
      .from('gmb_locations')
      .select('*, gmb_account:gmb_accounts(*)')
      .in('id', location_ids)
      .eq('organization_id', organization_id)

    if (locationsError) {
      throw new Error(`Failed to get locations: ${locationsError.message}`)
    }

    let successCount = 0
    let failCount = 0
    const errors = []

    // Update each location
    for (const location of locations || []) {
      try {
        const accessToken = location.gmb_account.access_token

        // Prepare update payload based on update type
        let updatePayload = {}
        let updateMask = []

        switch (update_type) {
          case 'description':
            updatePayload = {
              profile: {
                description: update_data.description
              }
            }
            updateMask = ['profile.description']
            break

          case 'hours':
            updatePayload = {
              regularHours: update_data.hours
            }
            updateMask = ['regularHours']
            break

          case 'phone':
            updatePayload = {
              phoneNumbers: {
                primaryPhone: update_data.phone
              }
            }
            updateMask = ['phoneNumbers.primaryPhone']
            break

          case 'website':
            updatePayload = {
              websiteUri: update_data.website
            }
            updateMask = ['websiteUri']
            break

          case 'attributes':
            updatePayload = {
              attributes: update_data.attributes
            }
            updateMask = ['attributes']
            break

          default:
            throw new Error(`Unknown update type: ${update_type}`)
        }

        // Update via Google My Business API
        const updateResponse = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${location.location_id}?updateMask=${updateMask.join(',')}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
          }
        )

        if (updateResponse.ok) {
          // Update local database
          const updateFields = {}
          if (update_type === 'description') updateFields.description = update_data.description
          if (update_type === 'hours') updateFields.hours = update_data.hours
          if (update_type === 'phone') updateFields.phone = update_data.phone
          if (update_type === 'website') updateFields.website = update_data.website
          if (update_type === 'attributes') updateFields.attributes = update_data.attributes
          updateFields.last_synced_at = new Date().toISOString()

          await supabaseClient
            .from('gmb_locations')
            .update(updateFields)
            .eq('id', location.id)

          successCount++
        } else {
          const errorText = await updateResponse.text()
          failCount++
          errors.push({
            location_id: location.id,
            location_name: location.location_name,
            error: errorText,
          })
        }

      } catch (error) {
        failCount++
        errors.push({
          location_id: location.id,
          location_name: location.location_name,
          error: error.message,
        })
      }
    }

    // Update bulk update record
    await supabaseClient
      .from('gmb_bulk_updates')
      .update({
        status: failCount === 0 ? 'completed' : 'failed',
        successful_updates: successCount,
        failed_updates: failCount,
        error_details: errors.length > 0 ? errors : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', bulkUpdate.id)

    return new Response(
      JSON.stringify({
        success: true,
        bulk_update_id: bulkUpdate.id,
        total_locations: location_ids.length,
        successful_updates: successCount,
        failed_updates: failCount,
        errors: errors,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in gmb_bulk_update:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
