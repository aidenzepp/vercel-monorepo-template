import type { Toast as ToastPrimitive } from "@base-ui/react/toast";
import type * as ToastModule from "@workspace/ui/components/toast";
import {
  createToastManager,
  toast,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  Toaster,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from "@workspace/ui/components/toast";

/**
 * The complete value API exposed by the application toast module.
 */
const publicToastApi = {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toaster,
  createToastManager,
  toast,
  useToastManager,
} satisfies typeof ToastModule;

void publicToastApi;

/**
 * The isolated manager retains Base UI's native manager contract.
 */
const manager: ReturnType<typeof ToastPrimitive.createToastManager> =
  createToastManager();

manager.add({ title: "Custom", type: "custom" });

void manager;
