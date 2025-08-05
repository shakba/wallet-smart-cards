import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, User, Building, Phone, Mail, Globe, MapPin, LinkedinIcon } from "lucide-react";

const businessCardSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Invalid website URL").optional().or(z.literal("")),
  address: z.string().optional(),
});

type BusinessCardFormData = z.infer<typeof businessCardSchema>;

interface BusinessCardFormProps {
  onFormChange: (data: BusinessCardFormData & { profileImage?: File; companyLogo?: File }) => void;
  initialData?: Partial<BusinessCardFormData>;
}

export function BusinessCardForm({ onFormChange, initialData }: BusinessCardFormProps) {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);

  const {
    register,
    watch,
    formState: { errors },
    setValue,
  } = useForm<BusinessCardFormData>({
    resolver: zodResolver(businessCardSchema),
    defaultValues: initialData,
    mode: "onChange",
  });

  const formData = watch();

  // Watch for form changes and notify parent
  const handleFormChange = () => {
    const data = {
      ...formData,
      profileImage: profileImage || undefined,
      companyLogo: companyLogo || undefined,
    };
    onFormChange(data);
  };

  // Trigger handleFormChange whenever form data changes
  const watchedData = watch();
  React.useEffect(() => {
    handleFormChange();
  }, [watchedData, profileImage, companyLogo]);

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
      </CardContent>
    </Card>
  );
}