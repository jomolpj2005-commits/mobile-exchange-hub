import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: RootRedirect,
});

function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/products", replace: true });
  }, [navigate]);

  return null;
}
