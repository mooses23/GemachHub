import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth, RegisterData } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  firstNameHe: z.string().optional(),
  lastNameHe: z.string().optional(),
  phone: z.string().optional(),
  inviteCode: z.string().min(1, "Invite code is required"),
});

type FormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { registerMutation } = useAuth();
  const { t } = useLanguage();

  const form = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      firstNameHe: "",
      lastNameHe: "",
      phone: "",
      inviteCode: "",
    },
  });

  function onSubmit(values: FormData) {
    registerMutation.mutate({
      ...values,
      firstNameHe: values.firstNameHe?.trim() || null,
      lastNameHe: values.lastNameHe?.trim() || null,
      phone: values.phone?.trim() || null,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">{t("createAnAccount")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("registerToAccessServices")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("firstName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("firstNamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("lastName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("lastNamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstNameHe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם פרטי (עברית) <span className="text-xs font-normal text-muted-foreground">— optional</span></FormLabel>
                  <FormControl>
                    <Input dir="rtl" placeholder="לדוגמה: שרה" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastNameHe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם משפחה (עברית) <span className="text-xs font-normal text-muted-foreground">— optional</span></FormLabel>
                  <FormControl>
                    <Input dir="rtl" placeholder="לדוגמה: כהן" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Phone <span className="text-xs font-normal text-muted-foreground">— optional</span>
                </FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+1 555 123 4567" {...field} value={field.value ?? ""} />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Used to contact you about your gemach. Not shared publicly.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("emailPlaceholderExample")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("username")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("chooseUsernamePlaceholder")} {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Only used for full-account login. Day-to-day operator access uses the location code + PIN.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("createPasswordPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inviteCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inviteCode")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("enterInviteCodePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("creatingAccount")}
              </>
            ) : (
              t("register")
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
