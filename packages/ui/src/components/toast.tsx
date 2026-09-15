"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  BadgeCheck,
  CircleInfo,
  OctagonWarning,
  TriangleWarning,
} from "@workspace/ui/icons";
import { cn } from "@workspace/ui/lib/utils";
import { X } from "lucide-react";
import * as React from "react";

/**
 * The shared application toast manager.
 */
const toast = ToastPrimitive.createToastManager();

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed inset-x-4 top-4 z-50 mx-auto w-auto max-w-sm outline-none sm:w-full",
        className
      )}
      {...props}
    />
  );
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group/toast bg-popover text-popover-foreground focus-visible:border-ring focus-visible:ring-ring/50 pointer-events-auto absolute inset-x-0 top-0 z-[calc(1000-var(--toast-index))] w-full origin-top rounded-2xl! border shadow-lg will-change-transform outline-none select-none focus-visible:ring-[3px]",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)+calc(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "data-limited:opacity-0 data-starting-style:[transform:translateY(-150%)]",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(-150%)]",
        "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        className
      )}
      {...props}
    />
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex h-full flex-col gap-3 overflow-hidden p-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        className
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function ToastAction({
  className,
  render = <Button color="neutral" variant="secondary" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-cuelume-toggle="press"
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

function ToastClose({
  className,
  children,
  render = <Button color="neutral" variant="secondary" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      data-cuelume-toggle="press"
      aria-label="Close toast"
      render={render}
      className={cn(
        "relative shrink-0 after:absolute after:-inset-2 after:content-['']",
        className
      )}
      {...props}
    >
      {children ?? <X aria-hidden="true" />}
    </ToastPrimitive.Close>
  );
}

/**
 * Displays the semantic status mark selected by a toast type.
 *
 * @param props - The toast state used to select an icon and palette.
 * @param props.type - The application toast type selecting an icon and palette.
 * @returns The Fill Duo status icon for the supplied type.
 */
function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode;

  switch (type) {
    case "success": {
      icon = (
        <BadgeCheck
          className="size-5"
          primaryColor="var(--success-foreground)"
          secondaryColor="var(--success)"
        />
      );
      break;
    }
    case "info": {
      icon = (
        <CircleInfo
          className="size-5"
          primaryColor="var(--info-foreground)"
          secondaryColor="var(--info)"
        />
      );
      break;
    }
    case "warning": {
      icon = (
        <TriangleWarning
          className="size-5"
          primaryColor="var(--warning-foreground)"
          secondaryColor="var(--warning)"
        />
      );
      break;
    }
    case "error": {
      icon = (
        <OctagonWarning
          className="size-5"
          primaryColor="var(--destructive-foreground)"
          secondaryColor="var(--destructive)"
        />
      );
      break;
    }
    case "loading": {
      icon = (
        <Spinner aria-label={undefined} className="size-5" role={undefined} />
      );
      break;
    }
    default: {
      return null;
    }
  }

  return (
    <span
      aria-hidden="true"
      data-slot="toast-icon"
      className="flex size-7 shrink-0 items-center justify-center [&_svg]:pointer-events-none"
    >
      {icon}
    </span>
  );
}

/**
 * Displays a toast's title and optional supporting description.
 *
 * @returns The flexible message column used by the toast header.
 */
function ToastMessage() {
  return (
    <div
      data-slot="toast-message"
      className="flex min-w-0 flex-1 flex-col gap-1 pt-1"
    >
      <ToastTitle />
      <ToastDescription />
    </div>
  );
}

/**
 * Displays the top-aligned status, message, and dismissal columns.
 *
 * @param props - The toast state needed by the status column.
 * @param props.type - The optional application toast type shown by the header.
 * @returns The primary content row of a toast.
 */
function ToastHeader({ type }: { type: string | undefined }) {
  return (
    <div data-slot="toast-header" className="flex items-start gap-3">
      <ToastIcon type={type} />
      <ToastMessage />
      <ToastClose />
    </div>
  );
}

/**
 * Displays a toast's optional action in its own trailing row.
 *
 * @returns The right-aligned action row beneath the toast header.
 */
function ToastFooter() {
  return (
    <div data-slot="toast-footer" className="flex justify-end">
      <ToastAction />
    </div>
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toastItem) => {
    const hasAction = toastItem.actionProps !== undefined;

    return (
      <Toast key={toastItem.id} toast={toastItem}>
        <ToastContent>
          <ToastHeader type={toastItem.type} />
          {hasAction ? <ToastFooter /> : null}
        </ToastContent>
      </Toast>
    );
  });
}

function Toaster({
  children,
  toastManager = toast,
  ...props
}: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
};
