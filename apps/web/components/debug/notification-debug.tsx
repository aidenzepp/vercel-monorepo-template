"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { toast } from "@workspace/ui/components/toast";
import type { ComponentProps } from "react";

/**
 * Keeps the loading toast visible long enough for visual inspection.
 *
 * @returns A promise that resolves after the loading preview has been shown.
 */
const simulateNotificationOperation = async (): Promise<void> => {
  const operation = Promise.withResolvers<null>();

  window.setTimeout(() => {
    operation.resolve(null);
  }, 3000);
  await operation.promise;
};

/**
 * Representative toast payloads available from the development preview.
 */
const TOAST_EXAMPLES = [
  {
    color: "neutral",
    label: "Regular",
    publish: () => {
      toast.add({ title: "Draft saved" });
    },
  },
  {
    color: "success",
    label: "Success",
    publish: () => {
      toast.add({ title: "Passkey added", type: "success" });
    },
  },
  {
    color: "default",
    label: "Info",
    publish: () => {
      toast.add({ title: "A new update is available", type: "info" });
    },
  },
  {
    color: "warning",
    label: "Warning",
    publish: () => {
      toast.add({ title: "Your connection is unstable", type: "warning" });
    },
  },
  {
    color: "destructive",
    label: "Error",
    publish: () => {
      toast.add({ title: "Could not save changes", type: "error" });
    },
  },
  {
    color: "neutral",
    label: "Loading",
    publish: () => {
      void toast.promise(simulateNotificationOperation(), {
        error: { title: "Could not save changes" },
        loading: { title: "Saving changes" },
        success: { title: "Changes saved" },
      });
    },
  },
  {
    color: "neutral",
    label: "Action",
    publish: () => {
      toast.add({
        actionProps: {
          children: "Undo",
          onClick: () => {
            toast.add({ title: "Conversation restored", type: "success" });
          },
        },
        description: "The conversation was moved to your archive.",
        id: "action-toast-preview",
        timeout: 0,
        title: "Message archived",
      });
    },
  },
] satisfies readonly {
  color: NonNullable<ComponentProps<typeof Button>["color"]>;
  label: string;
  publish: () => void;
}[];

/**
 * Displays development controls for the shared toast renderer.
 *
 * @returns Controls that publish representative payloads through the shared
 *   Base UI manager.
 */
const NotificationDebug = () => (
  <Card>
    <CardHeader>
      <CardTitle>Opinionated Base UI toast</CardTitle>
      <CardDescription>
        The shared renderer with outlined status icons in its top-center
        position.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2">
        {TOAST_EXAMPLES.map(({ color, label, publish }) => (
          <Button key={label} color={color} onClick={publish} variant="outline">
            {label}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
);

export { NotificationDebug };
