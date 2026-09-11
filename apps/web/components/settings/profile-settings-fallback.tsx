"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useErrorBoundaryRetry } from "@workspace/ui/next/error-boundary";

/**
 * Preserves the profile card’s shape while its fields load.
 */
const ProfileSettingsLoading = () => (
  <Card aria-busy="true" aria-label="Loading profile settings">
    <CardHeader>
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-4 w-64 max-w-full" />
    </CardHeader>
    <CardContent className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-full" />
      </div>
    </CardContent>
  </Card>
);

/**
 * Explains a profile-loading failure and retries only the failed region.
 */
const ProfileSettingsError = () => {
  const retry = useErrorBoundaryRetry();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile unavailable</CardTitle>
        <CardDescription>
          We couldn’t load your profile settings. Try again.
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-end">
        <Button
          color="neutral"
          onClick={() => {
            retry();
          }}
          variant="outline"
        >
          Try again
        </Button>
      </CardFooter>
    </Card>
  );
};

export { ProfileSettingsError, ProfileSettingsLoading };
