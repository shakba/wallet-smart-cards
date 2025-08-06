import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, User, Building, Phone, Mail, Globe, MapPin, LinkedinIcon, Palette } from "lucide-react";

const businessCardSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Invalid website URL").optional().or(z.literal("")),
  address: z.string().optional(),
  backgroundColor: z.string().optional(),
  foregroundColor: z.string().optional(),
  labelColor: z.string().optional(),
});

type BusinessCardFormData = z.infer<typeof businessCardSchema>;

interface BusinessCardFormProps {
  onFormChange: (data: BusinessCardFormData & { 
    profileImage?: File; 
    companyLogo?: File;
    backgroundColor?: string;
    foregroundColor?: string;
    labelColor?: string;
  }) => void;
  initialData?: Partial<BusinessCardFormData>;
}

export function BusinessCardForm({ onFormChange, initialData }: BusinessCardFormProps) {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");
  const [foregroundColor, setForegroundColor] = useState<string>("#000000");
  const [labelColor, setLabelColor] = useState<string>("#666666");

  const {
    register,
    formState: { errors },
    getValues,
  } = useForm<BusinessCardFormData>({
    resolver: zodResolver(businessCardSchema),
    defaultValues: initialData,
    mode: "onChange",
  });

  // Handle form data changes without useEffect to avoid infinite loops
  const handleInputChange = () => {
    const formData = getValues();
    const data = {
      ...formData,
      profileImage: profileImage || undefined,
      companyLogo: companyLogo || undefined,
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      labelColor: labelColor,
    };
    onFormChange(data);
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "logo"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === "profile") {
        setProfileImage(file);
      } else {
        setCompanyLogo(file);
      }
      // Trigger form change after file state is updated
      setTimeout(() => {
        const formData = getValues();
        const data = {
          ...formData,
          profileImage: type === "profile" ? file : (profileImage || undefined),
          companyLogo: type === "logo" ? file : (companyLogo || undefined),
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          labelColor: labelColor,
        };
        onFormChange(data);
      }, 0);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Business Card Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              {...register("fullName")}
              placeholder="John Doe"
              onChange={(e) => {
                register("fullName").onChange(e);
                handleInputChange();
              }}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="jobTitle">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="jobTitle"
              {...register("jobTitle")}
              placeholder="Software Engineer"
              onChange={(e) => {
                register("jobTitle").onChange(e);
                handleInputChange();
              }}
            />
            {errors.jobTitle && (
              <p className="text-sm text-destructive mt-1">{errors.jobTitle.message}</p>
            )}
          </div>
        </div>

        {/* Optional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Company
            </Label>
            <Input
              id="company"
              {...register("company")}
              placeholder="Tech Corp"
              onChange={(e) => {
                register("company").onChange(e);
                handleInputChange();
              }}
            />
          </div>

          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="john@example.com"
              onChange={(e) => {
                register("email").onChange(e);
                handleInputChange();
              }}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+1 (555) 123-4567"
              onChange={(e) => {
                register("phone").onChange(e);
                handleInputChange();
              }}
            />
          </div>

          <div>
            <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
              <LinkedinIcon className="h-4 w-4" />
              LinkedIn URL
            </Label>
            <Input
              id="linkedinUrl"
              {...register("linkedinUrl")}
              placeholder="https://linkedin.com/in/johndoe"
              onChange={(e) => {
                register("linkedinUrl").onChange(e);
                handleInputChange();
              }}
            />
            {errors.linkedinUrl && (
              <p className="text-sm text-destructive mt-1">{errors.linkedinUrl.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="websiteUrl" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website URL
            </Label>
            <Input
              id="websiteUrl"
              {...register("websiteUrl")}
              placeholder="https://johndoe.com"
              onChange={(e) => {
                register("websiteUrl").onChange(e);
                handleInputChange();
              }}
            />
            {errors.websiteUrl && (
              <p className="text-sm text-destructive mt-1">{errors.websiteUrl.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="123 Main St, City, State"
              onChange={(e) => {
                register("address").onChange(e);
                handleInputChange();
              }}
            />
          </div>
        </div>

        {/* File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Profile Picture
            </Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "profile")}
              className="cursor-pointer"
            />
            {profileImage && (
              <p className="text-sm text-muted-foreground mt-1">
                {profileImage.name}
              </p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Company Logo
            </Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "logo")}
              className="cursor-pointer"
            />
            {companyLogo && (
              <p className="text-sm text-muted-foreground mt-1">
                {companyLogo.name}
              </p>
            )}
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Palette className="h-5 w-5" />
            Card Colors
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="backgroundColor" className="text-sm">
                Background Color
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    handleInputChange();
                  }}
                  className="w-16 h-10 p-1 border cursor-pointer"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    handleInputChange();
                  }}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="foregroundColor" className="text-sm">
                Text Color
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="foregroundColor"
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => {
                    setForegroundColor(e.target.value);
                    handleInputChange();
                  }}
                  className="w-16 h-10 p-1 border cursor-pointer"
                />
                <Input
                  type="text"
                  value={foregroundColor}
                  onChange={(e) => {
                    setForegroundColor(e.target.value);
                    handleInputChange();
                  }}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="labelColor" className="text-sm">
                Label Color
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="labelColor"
                  type="color"
                  value={labelColor}
                  onChange={(e) => {
                    setLabelColor(e.target.value);
                    handleInputChange();
                  }}
                  className="w-16 h-10 p-1 border cursor-pointer"
                />
                <Input
                  type="text"
                  value={labelColor}
                  onChange={(e) => {
                    setLabelColor(e.target.value);
                    handleInputChange();
                  }}
                  className="flex-1"
                  placeholder="#666666"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}