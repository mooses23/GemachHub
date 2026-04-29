import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGemachApplicationStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { GemachApplication, Location } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { CheckCircle, Copy, MapPin, Settings, Hash, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";

interface LocationApprovalFormProps {
  application: GemachApplication;
  locations: Location[];
}

const labelClass = "text-xs font-medium text-muted-foreground block mb-1.5";

function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 border-t border-border/60 ml-1" />
    </div>
  );
}

export function LocationApprovalForm({ application, locations }: LocationApprovalFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [customLocationCode, setCustomLocationCode] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  const approvalMutation = useMutation({
    mutationFn: async () => {
      await updateGemachApplicationStatus(application.id, "approved");
    },
    onSuccess: () => {
      toast({
        title: t("applicationApproved"),
        description: t("applicationApprovedDesc"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: `${t("failedToApproveApplication")}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const generateLocationDetails = () => {
    const baseLocation = selectedLocation || locations[0];
    const locationCode = customLocationCode || `#${locations.length + 1}`;
    
    return {
      name: `${application.city} - ${application.firstName} ${application.lastName}`,
      locationCode,
      contactPerson: `${application.firstName} ${application.lastName}`,
      address: application.streetAddress,
      zipCode: application.zipCode || "",
      phone: application.phone,
      email: application.email,
      depositAmount: baseLocation?.depositAmount || 20,
      processingFee: baseLocation?.processingFeePercent ? (baseLocation.processingFeePercent / 100) : 3.0,
      paymentMethods: baseLocation?.paymentMethods || ["cash", "stripe", "paypal"]
    };
  };

  const locationDetails = generateLocationDetails();

  const detailsText = `
BABY BANZ EARMUFFS GEMACH - NEW LOCATION APPROVED

Congratulations! Your application to open a gemach location has been approved.

LOCATION DETAILS:
Name: ${locationDetails.name}
Location Code: ${locationDetails.locationCode}
Contact Person: ${locationDetails.contactPerson}
Address: ${locationDetails.address}
Zip Code: ${locationDetails.zipCode}
Phone: ${locationDetails.phone}
Email: ${locationDetails.email}

DEPOSIT INFORMATION:
Base Deposit: $${locationDetails.depositAmount}.00
Processing Fee: ${locationDetails.processingFee}% (for digital payments)
Accepted Payment Methods: ${locationDetails.paymentMethods.join(", ")}

NEXT STEPS:
1. We will send you an initial inventory of earmuffs
2. You'll receive login credentials to manage your location
3. Setup instructions will be provided separately
4. Your location will be added to our website within 24 hours

Thank you for joining our network of volunteers helping families with noise sensitivity!

${customInstructions ? `\nADDITIONAL INSTRUCTIONS:\n${customInstructions}` : ""}

For questions, contact us at earmuffsgemach@gmail.com
  `.trim();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(detailsText);
      toast({
        title: t("copied"),
        description: t("locationDetailsCopied"),
      });
    } catch (err) {
      toast({
        title: t("copyFailed"),
        description: t("manuallyCopyText"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-4 w-4 mr-1" />
          {t("approveLocationButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t("approveLocationFor")}: {application.firstName} {application.lastName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <SectionHeading icon={Settings} label={t("configuration")} />

            <div>
              <label htmlFor="locationCode" className={labelClass}>
                {t("customLocationCodeOptional")}
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="locationCode"
                  value={customLocationCode}
                  onChange={(e) => setCustomLocationCode(e.target.value)}
                  placeholder={`#${locations.length + 1}`}
                  className="h-11 pl-9 text-sm border-border/70 hover:border-border transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div>
              <label htmlFor="baseLocation" className={labelClass}>
                {t("baseSettingsFrom")}
              </label>
              <select
                id="baseLocation"
                className="h-11 w-full rounded-md border border-border/70 bg-background px-3 text-sm hover:border-border transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                value={selectedLocation?.id || ""}
                onChange={(e) => {
                  const location = locations.find(l => l.id === parseInt(e.target.value));
                  setSelectedLocation(location || null);
                }}
              >
                <option value="">{t("defaultSettings")}</option>
                {locations.slice(0, 5).map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} (${location.depositAmount}, {(location.processingFeePercent || 300)/100}% fee)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <SectionHeading icon={FileText} label={t("additionalInstructionsOptional")} />
              <div className="mt-3">
                <Textarea
                  id="instructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder={t("specialSetupInstructions")}
                  rows={4}
                  className="text-sm leading-relaxed border-border/70 hover:border-border transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div className="border-t border-border/60 pt-4 flex gap-3">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1 h-11 text-sm">
                <Copy className="h-4 w-4 mr-2" />
                {t("copyDetails")}
              </Button>
              <Button 
                onClick={() => approvalMutation.mutate()} 
                disabled={approvalMutation.isPending}
                className="flex-1 h-11 text-sm"
              >
                {approvalMutation.isPending ? t("approving") : t("approveAndSend")}
              </Button>
            </div>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("locationDetailsToSend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border max-h-96 overflow-y-auto">
                  {detailsText}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
