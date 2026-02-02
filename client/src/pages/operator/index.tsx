import { Redirect } from "wouter";
import { useLanguage } from "@/hooks/use-language";

// This file serves as the base route for operator paths
// It redirects to the operator dashboard
export default function OperatorIndex() {
  const { t } = useLanguage();
  return <Redirect to="/operator/dashboard" />;
}