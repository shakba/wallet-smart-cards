import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { passData } = await req.json()
    console.log('Generating pass for:', passData.full_name)

    // Get secrets from Supabase
    const certificatePem = Deno.env.get('CERTIFICATE_PEM')
    const keyPem = Deno.env.get('KEY_PEM')
    const wwdrPem = Deno.env.get('APPLE_WWDR_PEM')
    const keyPassphrase = Deno.env.get('KEY_PASSPHRASE')

    console.log('Certificates available:', !!certificatePem, !!keyPem, !!wwdrPem)

    if (!certificatePem || !keyPem || !wwdrPem) {
      throw new Error('Missing required Apple certificates')
    }

    // Create pass.json - simplified version for now
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.businesspass.card",
      serialNumber: passData.public_id,
      teamIdentifier: "YOUR_TEAM_ID", // User needs to update this
      organizationName: passData.company || "Business Card",
      description: `${passData.full_name} - Business Card`,
      logoText: passData.company || passData.full_name,
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(60, 60, 67)",
      generic: {
        primaryFields: [
          {
            key: "name",
            label: "Name",
            value: passData.full_name
          }
        ],
        secondaryFields: [
          {
            key: "title",
            label: "Title", 
            value: passData.job_title
          }
        ],
        auxiliaryFields: [],
        backFields: [
          {
            key: "email",
            label: "Email",
            value: passData.email || ""
          },
          {
            key: "phone", 
            label: "Phone",
            value: passData.phone || ""
          },
          {
            key: "website",
            label: "Website", 
            value: passData.website_url || ""
          },
          {
            key: "linkedin",
            label: "LinkedIn",
            value: passData.linkedin_url || ""
          },
          {
            key: "address",
            label: "Address",
            value: passData.address || ""
          }
        ].filter(field => field.value)
      }
    }

    // Add company to secondary fields if present
    if (passData.company) {
      passJson.generic.secondaryFields.push({
        key: "company",
        label: "Company",
        value: passData.company
      })
    }

    const passJsonString = JSON.stringify(passJson, null, 2)
    console.log('Pass JSON created, length:', passJsonString.length)

    // For now, return the pass data without signing
    // TODO: Implement proper signing with Web Crypto API
    const response = {
      success: true,
      message: "Pass generation is in development. Certificates are configured but signing needs Web Crypto API implementation.",
      passData: passJson,
      downloadUrl: `data:application/json;base64,${btoa(passJsonString)}`
    }

    console.log('Returning response')

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error generating pass:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})