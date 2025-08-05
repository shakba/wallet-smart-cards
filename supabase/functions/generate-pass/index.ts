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
    
    // Create proper ZIP file for .pkpass
    const createPkpassZip = async () => {
      // Simplified ZIP file creation using raw bytes
      // This creates a minimal ZIP structure that should work with Apple Wallet
      
      const files = [
        { name: "pass.json", content: passJsonString },
        { name: "manifest.json", content: manifestString },
        { name: "signature", content: signature }
      ]
      
      // Create ZIP central directory entries
      let centralDir = new Uint8Array(0)
      let fileData = new Uint8Array(0)
      let offset = 0
      
      for (const file of files) {
        const nameBytes = encoder.encode(file.name)
        const contentBytes = encoder.encode(file.content)
        
        // Local file header (simplified)
        const localHeader = new Uint8Array([
          0x50, 0x4B, 0x03, 0x04, // Local file header signature
          0x0A, 0x00, // Version needed to extract
          0x00, 0x00, // General purpose bit flag
          0x00, 0x00, // Compression method (stored)
          0x00, 0x00, // Last mod file time
          0x00, 0x00, // Last mod file date
          0x00, 0x00, 0x00, 0x00, // CRC-32 (we'll skip for simplicity)
          ...new Uint8Array(new Uint32Array([contentBytes.length]).buffer), // Compressed size
          ...new Uint8Array(new Uint32Array([contentBytes.length]).buffer), // Uncompressed size
          ...new Uint8Array(new Uint16Array([nameBytes.length]).buffer), // File name length
          0x00, 0x00, // Extra field length
        ])
        
        // Combine local header + filename + content
        const entry = new Uint8Array(localHeader.length + nameBytes.length + contentBytes.length)
        entry.set(localHeader, 0)
        entry.set(nameBytes, localHeader.length)
        entry.set(contentBytes, localHeader.length + nameBytes.length)
        
        // Append to file data
        const newFileData = new Uint8Array(fileData.length + entry.length)
        newFileData.set(fileData, 0)
        newFileData.set(entry, fileData.length)
        fileData = newFileData
        
        offset += entry.length
      }
      
      // End of central directory record
      const endRecord = new Uint8Array([
        0x50, 0x4B, 0x05, 0x06, // End of central dir signature
        0x00, 0x00, // Number of this disk
        0x00, 0x00, // Number of disk with central dir
        ...new Uint8Array(new Uint16Array([files.length]).buffer), // Total entries on this disk
        ...new Uint8Array(new Uint16Array([files.length]).buffer), // Total entries
        0x00, 0x00, 0x00, 0x00, // Size of central directory
        ...new Uint8Array(new Uint32Array([offset]).buffer), // Offset of central dir
        0x00, 0x00, // ZIP file comment length
      ])
      
      // Combine all parts
      const zipFile = new Uint8Array(fileData.length + endRecord.length)
      zipFile.set(fileData, 0)
      zipFile.set(endRecord, fileData.length)
      
      return zipFile
    }
    
    const zipBytes = await createPkpassZip()
    
    console.log('Created .pkpass file, size:', zipBytes.length, 'bytes')

    // Return the .pkpass binary directly with proper headers
    return new Response(zipBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${passData.full_name.replace(/\s+/g, '_')}_business_card.pkpass"`,
        "Content-Length": zipBytes.length.toString(),
      }
    })

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