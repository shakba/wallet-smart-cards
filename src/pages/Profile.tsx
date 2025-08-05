import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Globe, MapPin, MessageCircle, LinkedinIcon, User, Building } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ProfileData {
  full_name: string;
  job_title: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  website_url?: string;
  address?: string;
  profile_image_url?: string;
  company_logo_url?: string;
}

export default function Profile() {
  const { publicId } = useParams<{ publicId: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publicId) {
      fetchProfile();
    }
  }, [publicId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("passes")
        .select("*")
        .eq("public_id", publicId)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
      } else {
        setError("Profile not found");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (profile?.phone) {
      const cleanPhone = profile.phone.replace(/[^\d]/g, "");
      window.open(`https://wa.me/${cleanPhone}`, "_blank");
    }
  };

  const handleCall = () => {
    if (profile?.phone) {
      window.open(`tel:${profile.phone}`, "_self");
    }
  };

  const handleEmail = () => {
    if (profile?.email) {
      window.open(`mailto:${profile.email}`, "_self");
    }
  };

  const handleLinkedIn = () => {
    if (profile?.linkedin_url) {
      window.open(profile.linkedin_url, "_blank");
    }
  };

  const handleWebsite = () => {
    if (profile?.website_url) {
      window.open(profile.website_url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Fetching profile information</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground">
              {error || "The requested profile could not be found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Header with profile and company info */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex items-center justify-between w-full mb-4">
                <div className="flex-1" />
                {profile.company_logo_url ? (
                  <img
                    src={profile.company_logo_url}
                    alt="Company Logo"
                    className="w-16 h-16 object-contain"
                  />
                ) : profile.company ? (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Building className="h-8 w-8 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="w-16 h-16" />
                )}
              </div>
              
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20 mb-4">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
              <p className="text-xl text-muted-foreground font-medium mb-1">
                {profile.job_title}
              </p>
              {profile.company && (
                <p className="text-lg text-muted-foreground">at {profile.company}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-3 mb-6">
              {profile.email && (
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1">{profile.email}</span>
                </div>
              )}
              
              {profile.phone && (
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1">{profile.phone}</span>
                </div>
              )}
              
              {profile.address && (
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1">{profile.address}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.phone && (
                <>
                  <Button onClick={handleWhatsApp} className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button onClick={handleCall} variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                </>
              )}
              
              {profile.email && (
                <Button onClick={handleEmail} variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}
              
              {profile.linkedin_url && (
                <Button onClick={handleLinkedIn} variant="outline" className="w-full">
                  <LinkedinIcon className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
              )}
              
              {profile.website_url && (
                <Button onClick={handleWebsite} variant="outline" className="w-full">
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}