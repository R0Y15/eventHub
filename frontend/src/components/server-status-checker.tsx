'use client';

import { useServerStatus } from "@/hooks/useServerStatus";
import { ServerLoader } from "@/components/ui/server-loader";

export function ServerStatusChecker() {
  const { isLoading, error } = useServerStatus();

  if (!isLoading) return null;
  
  // return <ServerLoader error={error} />;
} 