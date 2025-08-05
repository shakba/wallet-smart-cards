import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHash, createSign } from "https://deno.land/std@0.168.0/node/crypto.ts"

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

    // Get secrets from Supabase
    const certificatePem = Deno.env.get('CERTIFICATE_PEM')
    const keyPem = Deno.env.get('KEY_PEM')
    const wwdrPem = Deno.env.get('APPLE_WWDR_PEM')
    const keyPassphrase = Deno.env.get('KEY_PASSPHRASE')

    if (!certificatePem || !keyPem || !wwdrPem) {
      throw new Error('Missing required Apple certificates')
    }

    // Create pass.json
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.businesspass.card",
      serialNumber: passData.public_id,
      teamIdentifier: "YOUR_TEAM_ID",
      webServiceURL: `${req.headers.get('origin')}/api/passes`,
      authenticationToken: passData.public_id,
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

    // Create manifest
    const manifest = {
      "pass.json": createHash('sha1').update(passJsonString).digest('hex')
    }

    const manifestString = JSON.stringify(manifest, null, 2)

    // Create signature
    const signatureData = manifestString
    const sign = createSign('SHA1')
    sign.update(signatureData)
    
    // Import the private key
    const privateKey = {
      key: keyPem,
      passphrase: keyPassphrase || undefined
    }
    
    const signature = sign.sign(privateKey, 'base64')

    // Create the pass bundle (simplified for demo)
    const passBundle = {
      'pass.json': passJsonString,
      'manifest.json': manifestString,
      'signature': signature
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        passBundle,
        downloadUrl: `data:application/vnd.apple.pkpass;base64,${btoa(JSON.stringify(passBundle))}`
      }),
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