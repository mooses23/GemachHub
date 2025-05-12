import { Redirect } from "wouter";

// This file serves as the base route for operator paths
// It redirects to the operator dashboard
export default function OperatorIndex() {
  return <Redirect to="/operator/dashboard" />;
}