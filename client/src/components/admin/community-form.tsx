import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  createCityCategory,
  updateCityCategory,
  type CityCategoryInput,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderCircle, Globe, Settings, AlertTriangle } from "lucide-react";
import type { CityCategory, Region } from "@shared/schema";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const communitySchema = z.object({
  name: z.string().min(1, "Community name is required"),
  nameHe: z.string().optional().nullable(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  regionId: z.number().int().positive("Region is required"),
  stateCode: z.string().optional().nullable(),
  displayOrder: z.number().int().min(0),
  isPopular: z.boolean(),
  description: z.string().optional().nullable(),
  descriptionHe: z.string().optional().nullable(),
});

type CommunityFormData = z.infer<typeof communitySchema>;

interface CommunityFormProps {
  community?: CityCategory;
  regions: Region[];
  onSuccess?: (created?: CityCategory) => void;
  defaultRegionId?: number;
  defaultName?: string;
  defaultStateCode?: string;
}

const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["FL","Florida"],["GA","Georgia"],
  ["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],
  ["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
  ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],
  ["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],
  ["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],
  ["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
  ["DC","District of Columbia"],
] as const;

const inputClass =
  "h-10 px-3 text-sm border-border/70 transition-colors hover:border-border focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0";
const labelClass = "text-xs font-medium text-muted-foreground";

export function CommunityForm({
  community,
  regions,
  onSuccess,
  defaultRegionId,
  defaultName,
  defaultStateCode,
}: CommunityFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const initialName = community?.name ?? defaultName ?? "";
  const form = useForm<CommunityFormData>({
    resolver: zodResolver(communitySchema),
    defaultValues: community
      ? {
          name: community.name,
          nameHe: community.nameHe ?? "",
          slug: community.slug,
          regionId: community.regionId,
          stateCode: community.stateCode ?? "",
          displayOrder: community.displayOrder ?? 0,
          isPopular: !!community.isPopular,
          description: community.description ?? "",
          descriptionHe: community.descriptionHe ?? "",
        }
      : {
          name: initialName,
          nameHe: "",
          slug: initialName ? slugify(initialName) : "",
          regionId: defaultRegionId ?? regions[0]?.id ?? 1,
          stateCode: defaultStateCode ?? "",
          displayOrder: 0,
          isPopular: false,
          description: "",
          descriptionHe: "",
        },
  });

  const watchedName = form.watch("name");
  const watchedRegionId = form.watch("regionId");
  const slugManuallyEdited = React.useRef(!!community);
  React.useEffect(() => {
    if (!community && !slugManuallyEdited.current) {
      form.setValue("slug", slugify(watchedName || ""), { shouldValidate: false });
    }
  }, [watchedName, community, form]);

  const isUS = React.useMemo(() => {
    const r = regions.find((x) => x.id === watchedRegionId);
    return r?.slug === "united-states";
  }, [watchedRegionId, regions]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/city-categories"] });
    queryClient.invalidateQueries({ queryKey: ["/api/location-tree"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: CommunityFormData) =>
      createCityCategory({
        ...data,
        nameHe: data.nameHe || null,
        stateCode: isUS ? data.stateCode || null : null,
        description: data.description || null,
        descriptionHe: data.descriptionHe || null,
      } as CityCategoryInput),
    onSuccess: (created: CityCategory) => {
      toast({ title: "Success", description: "Community created." });
      invalidateAll();
      form.reset();
      slugManuallyEdited.current = false;
      onSuccess?.(created);
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CommunityFormData) =>
      updateCityCategory(community!.id, {
        ...data,
        nameHe: data.nameHe || null,
        stateCode: isUS ? data.stateCode || null : null,
        description: data.description || null,
        descriptionHe: data.descriptionHe || null,
      }),
    onSuccess: (updated: CityCategory) => {
      toast({ title: "Success", description: "Community updated." });
      invalidateAll();
      onSuccess?.(updated);
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const onSubmit = (data: CommunityFormData) => {
    if (community) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && (
          <div className="rounded-lg border border-amber-300/70 bg-amber-50 p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Please correct the highlighted fields.</span>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Community Name</span>
          </div>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>English</FormLabel>
                <FormControl><Input {...field} className={inputClass} placeholder="e.g., Brooklyn" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nameHe"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>עברית</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} dir="rtl" className={inputClass} placeholder="ברוקלין" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="regionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Region</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(parseInt(v, 10))}
                  value={String(field.value || "")}
                >
                  <FormControl>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select a region" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stateCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>State (US only)</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                  value={field.value || "__none__"}
                  disabled={!isUS}
                >
                  <FormControl>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder={isUS ? "Select a state" : "—"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {US_STATES.map(([code, name]) => (
                      <SelectItem key={code} value={code}>{code} — {name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>URL Slug</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={inputClass}
                    placeholder="e.g., brooklyn"
                    onChange={(e) => {
                      slugManuallyEdited.current = true;
                      field.onChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormDescription className="text-xs">Auto-generated from name; lowercase + hyphens only.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="displayOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Display Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isPopular"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3 space-y-0">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div>
                <FormLabel className="text-sm">Popular community</FormLabel>
                <FormDescription className="text-xs">Featured in the public location picker.</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description (optional)</span>
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>English</FormLabel>
                <FormControl><Textarea rows={2} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="descriptionHe"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>עברית</FormLabel>
                <FormControl><Textarea dir="rtl" rows={2} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t border-border/60 pt-4">
          <Button type="submit" className="w-full h-10" disabled={isPending}>
            {isPending ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                {community ? "Updating…" : "Creating…"}
              </>
            ) : community ? "Update Community" : "Create Community"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
