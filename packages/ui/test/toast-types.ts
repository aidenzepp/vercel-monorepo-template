import { createToastManager, toast } from "@workspace/ui/components/toast";

/**
 * An isolated manager used to verify the public toast type contract.
 */
const manager = createToastManager<Record<string, never>>();

manager.add({ title: "Saved", type: "success" });
manager.add({ title: "Heads up", type: "warning" });
toast.add({ title: "Loading", type: "loading" });

// @ts-expect-error -- Application toast managers reject unsupported types.
manager.add({ title: "Unknown", type: "custom" });

// @ts-expect-error -- The shared toast manager exposes the same closed type.
toast.update("toast-id", { type: "custom" });

void manager.promise(Promise.resolve("saved"), {
  error: { title: "Failed", type: "error" },
  loading: { title: "Saving", type: "loading" },
  success: { title: "Saved", type: "success" },
});

void manager.promise(Promise.resolve("saved"), {
  error: "Failed",
  // @ts-expect-error -- Promise phases cannot introduce unsupported types.
  loading: { title: "Saving", type: "custom" },
  success: "Saved",
});
