import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BusinessCardForm } from "@/components/BusinessCardForm";
import { PassPreview } from "@/components/PassPreview";
import { Dashboard } from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogIn, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FormData {
  fullName: string;
  jobTitle: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  address?: string;
  profileImage?: File;
  companyLogo?: File;
}

const Index = () => {
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    jobTitle: "",
  });
  const [showDashboard, setShowDashboard] = useState(false);
  const [editingPass, setEditingPass] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !editingPass) {
      setShowDashboard(true);
    }
  }, [user, editingPass]);

  const handleFormChange = (data: FormData) => {
    setFormData(data);
  };

  const handleCreateNew = () => {
    setShowDashboard(false);
    setEditingPass(null);
    setFormData({
      fullName: "",
      jobTitle: "",
    });
  };

  const handleEditPass = (pass: any) => {
    setEditingPass(pass);
    setShowDashboard(false);
    setFormData({
      fullName: pass.full_name,
      jobTitle: pass.job_title,
      company: pass.company || "",
      email: pass.email || "",
      phone: pass.phone || "",
      linkedinUrl: pass.linkedin_url || "",
      websiteUrl: pass.website_url || "",
      address: pass.address || "",
    });
  };

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    console.log(`Starting upload for ${bucket}:`, file.name);
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    // Create user-specific folder path
    const filePath = `${user!.id}/${fileName}`;
    console.log(`Upload path: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error(`Error uploading ${bucket}:`, uploadError);
      throw new Error(`Failed to upload ${bucket}: ${uploadError.message}`);
    }

    console.log(`Successfully uploaded ${bucket}`);
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`Public URL for ${bucket}:`, data.publicUrl);
    return data.publicUrl;
  };

  const handleSavePass = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!formData.fullName || !formData.jobTitle) {
      toast({
        title: "Missing Information",
        description: "Please fill in your full name and job title",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    console.log("Starting save operation...");
    console.log("Form data:", formData);
    console.log("User:", user);

    try {
      let profileImageUrl = editingPass?.profile_image_url;
      let companyLogoUrl = editingPass?.company_logo_url;

      // Upload profile image if provided
      if (formData.profileImage) {
        console.log("Uploading profile image...");
        profileImageUrl = await uploadFile(formData.profileImage, "profile-images");
        console.log("Profile image uploaded:", profileImageUrl);
      }

      // Upload company logo if provided
      if (formData.companyLogo) {
        console.log("Uploading company logo...");
        companyLogoUrl = await uploadFile(formData.companyLogo, "company-logos");
        console.log("Company logo uploaded:", companyLogoUrl);
      }

      const passData = {
        user_id: user.id,
        full_name: formData.fullName,
        job_title: formData.jobTitle,
        company: formData.company || null,
        email: formData.email || null,
        phone: formData.phone || null,
        linkedin_url: formData.linkedinUrl || null,
        website_url: formData.websiteUrl || null,
        address: formData.address || null,
        profile_image_url: profileImageUrl,
        company_logo_url: companyLogoUrl,
      };

      console.log("Saving to database with data:", passData);

      let result;
      if (editingPass) {
        console.log("Updating existing pass...");
        result = await supabase
          .from("passes")
          .update(passData)
          .eq("id", editingPass.id);
      } else {
        console.log("Inserting new pass...");
        result = await supabase
          .from("passes")
          .insert(passData);
      }

      console.log("Database operation result:", result);

      if (result.error) {
        console.error("Database error:", result.error);
        throw result.error;
      }

      console.log("Save operation completed successfully!");
      toast({
        title: "Success",
        description: editingPass ? "Business card updated successfully!" : "Business card saved successfully!",
      });

      setShowDashboard(true);
      setEditingPass(null);
    } catch (error) {
      console.error("Save operation failed:", error);
      toast({
        title: "Error",
        description: `Failed to save business card: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Setting up your experience</p>
        </div>
      </div>
    );
  }

  if (user && showDashboard) {
    return <Dashboard onCreateNew={handleCreateNew} onEditPass={handleEditPass} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Business Pass Creator</h1>
            <p className="text-muted-foreground">Create your professional digital business card</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!user ? (
              <Button onClick={() => navigate("/auth")}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            ) : (
              <Button onClick={() => setShowDashboard(true)} variant="outline">
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <BusinessCardForm
              onFormChange={handleFormChange}
              initialData={formData}
            />
            
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle>Save Your Business Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleSavePass} 
                    className="w-full" 
                    disabled={saving || !formData.fullName || !formData.jobTitle}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : editingPass ? "Update Pass" : "Save Pass"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <PassPreview data={formData} />
              </CardContent>
            </Card>

            {!user && (
              <Card>
                <CardHeader>
                  <CardTitle>Save Your Business Card</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Sign in to save your business card and create multiple cards
                  </p>
                  <Button onClick={() => navigate("/auth")} className="w-full">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In to Save
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
