import type { Toast as ToastPrimitive } from "@base-ui/react/toast";
import type * as ToastModule from "@workspace/ui/components/toast";
import {
  createToastManager,
  toast,
  Toaster,
} from "@workspace/ui/components/toast";

/**
 * The complete value API exposed by the application toast module.
 */
const publicToastApi = {
  Toaster,
  createToastManager,
  toast,
} satisfies typeof ToastModule;

void publicToastApi;

/**
 * The isolated manager retains Base UI's native manager contract.
 */
const manager: ReturnType<typeof ToastPrimitive.createToastManager> =
  createToastManager();

manager.add({ title: "Custom", type: "custom" });

void manager;
