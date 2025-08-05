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
    
    // For now, let's create a vCard format instead of pkpass
    // vCard is more universally supported and doesn't require Apple certificates
    
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${passData.full_name}
TITLE:${passData.job_title}
${passData.company ? `ORG:${passData.company}` : ''}
${passData.email ? `EMAIL:${passData.email}` : ''}
${passData.phone ? `TEL:${passData.phone}` : ''}
${passData.website_url ? `URL:${passData.website_url}` : ''}
${passData.linkedin_url ? `URL:${passData.linkedin_url}` : ''}
${passData.address ? `ADR:;;${passData.address};;;;` : ''}
END:VCARD`

    const vCardBytes = encoder.encode(vCard)
    const base64VCard = btoa(String.fromCharCode(...vCardBytes))
    
    console.log('Created vCard file, size:', vCardBytes.length, 'bytes')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Business card created successfully as vCard format",
        downloadUrl: `data:text/vcard;base64,${base64VCard}`,
        filename: `${passData.full_name.replace(/\s+/g, '_')}_business_card.vcf`
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