import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple ZIP creation for .pkpass file
function createZip(files: Record<string, string | Uint8Array>): Uint8Array {
  // This is a simplified ZIP implementation
  // For production, you'd want a proper ZIP library
  const encoder = new TextEncoder()
  const zipData: number[] = []
  
  // ZIP local file header signature
  const localFileHeader = [0x50, 0x4b, 0x03, 0x04]
  
  let centralDirectoryOffset = 0
  const centralDirectoryEntries: number[][] = []
  
  for (const [filename, content] of Object.entries(files)) {
    const filenameBytes = encoder.encode(filename)
    const contentBytes = typeof content === 'string' ? encoder.encode(content) : content
    
    // Local file header
    const localHeader = [
      ...localFileHeader,
      0x14, 0x00, // Version needed to extract
      0x00, 0x00, // General purpose bit flag
      0x00, 0x00, // Compression method (stored)
      0x00, 0x00, // Last mod file time
      0x00, 0x00, // Last mod file date
      0x00, 0x00, 0x00, 0x00, // CRC-32 (simplified - should calculate)
      ...intToBytes(contentBytes.length, 4), // Compressed size
      ...intToBytes(contentBytes.length, 4), // Uncompressed size
      ...intToBytes(filenameBytes.length, 2), // Filename length
      0x00, 0x00, // Extra field length
    ]
    
    zipData.push(...localHeader, ...filenameBytes, ...contentBytes)
  }
  
  // Central directory structure (simplified)
  const centralDirSignature = [0x50, 0x4b, 0x05, 0x06]
  zipData.push(...centralDirSignature)
  zipData.push(...new Array(18).fill(0)) // Simplified end of central directory
  
  return new Uint8Array(zipData)
}

function intToBytes(value: number, bytes: number): number[] {
  const result = []
  for (let i = 0; i < bytes; i++) {
    result.push(value & 0xff)
    value >>= 8
  }
  return result
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
    
    // Create manifest (simplified - should include SHA1 hashes)
    const manifest = {
      "pass.json": "placeholder-hash" // In production, calculate SHA1 hash
    }
    const manifestString = JSON.stringify(manifest)
    
    // Create signature placeholder (in production, sign with your certificates)
    const signature = "placeholder-signature"
    
    // Create .pkpass file structure
    const passFiles = {
      "pass.json": passJsonString,
      "manifest.json": manifestString,
      "signature": signature
    }
    
    // Create ZIP file
    const zipBytes = createZip(passFiles)
    const base64Zip = btoa(String.fromCharCode(...zipBytes))
    
    console.log('Created .pkpass file, size:', zipBytes.length, 'bytes')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Pass created successfully",
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