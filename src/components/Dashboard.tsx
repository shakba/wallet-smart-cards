import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Download, Edit, Eye, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Pass {
  id: string;
  full_name: string;
  job_title: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  website_url?: string;
  profile_image_url?: string;
  company_logo_url?: string;
  created_at: string;
  public_id: string;
}

interface DashboardProps {
  onCreateNew: () => void;
  onEditPass: (pass: Pass) => void;
}

export function Dashboard({ onCreateNew, onEditPass }: DashboardProps) {
  const { user, signOut } = useAuth();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    try {
      const { data, error } = await supabase
        .from("passes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPasses(data || []);
    } catch (error) {
      console.error("Error fetching passes:", error);
      toast({
        title: "Error",
        description: "Failed to load your business cards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (pass: Pass) => {
    window.open(`/profile/${pass.public_id}`, "_blank");
  };

  const handleDownload = async (pass: Pass) => {
    try {
      console.log('Starting download for pass:', pass.full_name);
      
      // Import the utility functions
      const { convertPassToApiFormat, generateBusinessCard } = await import('@/lib/passGeneration');
      
      // Convert pass data to API format
      const apiData = await convertPassToApiFormat(pass);
      
      // Generate and download the pass
      const result = await generateBusinessCard(apiData);
      
      if (result.success) {
        toast({
          title: "Download Started",
          description: "Your .pkpass file is being downloaded",
        });
      } else {
        throw new Error(result.error || 'Failed to generate pass');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed", 
        description: `Failed to generate pass: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Fetching your business cards</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Business Pass Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Business Cards</h2>
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Pass
          </Button>
        </div>

        {/* Cards Grid */}
        {passes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">No business cards yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first business card to get started
              </p>
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Pass
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {passes.map((pass) => (
              <Card key={pass.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    {pass.profile_image_url ? (
                      <img
                        src={pass.profile_image_url}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {pass.full_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {pass.full_name}
                      </CardTitle>
                      <CardDescription className="truncate">
                        {pass.job_title}
                        {pass.company && ` at ${pass.company}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProfile(pass)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditPass(pass)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(pass)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}