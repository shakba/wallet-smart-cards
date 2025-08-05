import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { ZipWriter } from "https://deno.land/x/zipjs@v2.7.34/index.js"

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

    // Create pass.json
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.businesspass.card",
      serialNumber: passData.public_id,
      teamIdentifier: "YOUR_TEAM_ID", // TODO: Update with actual team ID
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
    
    // Calculate SHA1 hash for manifest
    const encoder = new TextEncoder()
    const passData_bytes = encoder.encode(passJsonString)
    const hashBuffer = await crypto.subtle.digest('SHA-1', passData_bytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const passJsonHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Create manifest with proper SHA1 hashes
    const manifest = {
      "pass.json": passJsonHash
    }
    const manifestString = JSON.stringify(manifest)
    
    // Create a simple signature (in production, this should be cryptographically signed)
    const signature = "PLACEHOLDER_SIGNATURE_FOR_DEVELOPMENT"
    
    // Create ZIP archive for .pkpass file
    const zipWriter = new ZipWriter()
    
    // Add pass.json to ZIP
    await zipWriter.add("pass.json", passJsonString)
    
    // Add manifest.json to ZIP
    await zipWriter.add("manifest.json", manifestString)
    
    // Add signature to ZIP
    await zipWriter.add("signature", signature)
    
    // Generate the ZIP file as Uint8Array
    const zipBytes = await zipWriter.generate()
    
    console.log('Created .pkpass file, size:', zipBytes.length, 'bytes')
    
    // Convert to base64 for download
    const base64Zip = btoa(String.fromCharCode(...zipBytes))

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Business card created successfully as .pkpass file",
        downloadUrl: `data:application/vnd.apple.pkpass;base64,${base64Zip}`,
        filename: `${passData.full_name.replace(/\s+/g, '_')}_business_card.pkpass`
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