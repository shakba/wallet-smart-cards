import { Card, CardContent } from "@/components/ui/card";
import { QrCode, User, Building, Phone, Mail, Globe, MapPin, LinkedinIcon } from "lucide-react";

interface PassData {
  fullName?: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  address?: string;
  profileImage?: File;
  companyLogo?: File;
}

interface PassPreviewProps {
  data: PassData;
}

export function PassPreview({ data }: PassPreviewProps) {
  const profileImageUrl = data.profileImage 
    ? URL.createObjectURL(data.profileImage) 
    : null;
  
  const companyLogoUrl = data.companyLogo 
    ? URL.createObjectURL(data.companyLogo) 
    : null;

  // Generate QR code URL (placeholder for now)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `${window.location.origin}/profile/${data.fullName || 'user'}`
  )}`;

  return (
    <Card className="w-full max-w-sm mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 border-2">
      <CardContent className="p-6">
        {/* Header with profile and company logo */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {companyLogoUrl ? (
            <img
              src={companyLogoUrl}
              alt="Company Logo"
              className="w-10 h-10 object-contain"
            />
          ) : (
            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
              <Building className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Name and Title */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-foreground mb-1">
            {data.fullName || "Your Name"}
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            {data.jobTitle || "Your Job Title"}
          </p>
          {data.company && (
            <p className="text-sm text-muted-foreground">
              at {data.company}
            </p>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          {data.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{data.email}</span>
            </div>
          )}
          
          {data.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{data.phone}</span>
            </div>
          )}
          
          {data.linkedinUrl && (
            <div className="flex items-center space-x-2 text-sm">
              <LinkedinIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground truncate">LinkedIn</span>
            </div>
          )}
          
          {data.websiteUrl && (
            <div className="flex items-center space-x-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground truncate">Website</span>
            </div>
          )}
          
          {data.address && (
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground text-xs">{data.address}</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-2 rounded-lg">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-24 h-24"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}