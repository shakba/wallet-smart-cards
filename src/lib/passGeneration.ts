// Utility functions for Apple Wallet Pass generation using external API

interface PassData {
  fullName: string;
  jobTitle: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  address?: string;
  profileImage?: string; // Base64 data URL
  companyLogo?: string; // Base64 data URL
  backgroundColor?: string; // RGB format: "rgb(r,g,b)"
  foregroundColor?: string; // RGB format: "rgb(r,g,b)"
  labelColor?: string; // RGB format: "rgb(r,g,b)"
  qrCodeUrl?: string;
}

// Convert HEX color to RGB format
export const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : 
    hex;
};

// Convert File to Base64 data URL
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

// Generate Apple Wallet Pass using external API
export const generateBusinessCard = async (formData: PassData): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Generating business card with data:', formData);
    
    const response = await fetch('https://itamar-wallet-project.vercel.app/api/generate-pass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.fullName.replace(/\s+/g, '_')}_business_card.pkpass`;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true };
  } catch (error) {
    console.error('Error generating business card:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Convert database pass data to API format
export const convertPassToApiFormat = async (pass: any): Promise<PassData> => {
  const apiData: PassData = {
    fullName: pass.full_name,
    jobTitle: pass.job_title,
  };

  // Add optional fields
  if (pass.company) apiData.company = pass.company;
  if (pass.email) apiData.email = pass.email;
  if (pass.phone) apiData.phone = pass.phone;
  if (pass.linkedin_url) apiData.linkedinUrl = pass.linkedin_url;
  if (pass.website_url) apiData.websiteUrl = pass.website_url;
  if (pass.address) apiData.address = pass.address;

  // Handle profile image URL - convert to Base64 if it's a URL
  if (pass.profile_image_url) {
    try {
      const response = await fetch(pass.profile_image_url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      apiData.profileImage = base64;
    } catch (error) {
      console.warn('Failed to convert profile image to Base64:', error);
    }
  }

  // Handle company logo URL - convert to Base64 if it's a URL
  if (pass.company_logo_url) {
    try {
      const response = await fetch(pass.company_logo_url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      apiData.companyLogo = base64;
    } catch (error) {
      console.warn('Failed to convert company logo to Base64:', error);
    }
  }

  return apiData;
};