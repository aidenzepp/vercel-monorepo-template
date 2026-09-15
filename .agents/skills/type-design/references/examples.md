# Type Design Examples

Use these examples as labeled acceptance data. The decisive evidence above each excerpt determines its label.

Every snippet is a complete type-level excerpt. Its program units follow the repository's `document-code` contract so type design is the only labeled axis.

## External Library Boundaries

### NEGATIVE — A leaf claims a constraint the public API does not enforce

**Decisive evidence:** The exported manager accepts every string, while the icon consumer casts that open value to a closed union. Callers can create an unsupported value, and the cast hides rather than establishes the invariant.

```ts
/**
 * A presentation recognized by the application toast icon.
 */
type ToastIconType = "error" | "info" | "loading" | "success" | "warning";

/**
 * Claims an application icon type for a toast emitted by the external manager.
 *
 * @param props - The external toast data rendered by the icon.
 * @param props.type - The unconstrained external presentation name.
 * @returns The asserted icon type when the external toast has one.
 */
const getToastIconType = ({
  type,
}: {
  type?: string;
}): ToastIconType | undefined => {
  const iconType = type as ToastIconType | undefined;
  return iconType;
};
```

### POSITIVE — The application constrains its API and widens only at the adapter

**Decisive evidence:** The application owns one canonical presentation tuple, its public manager rejects other values, and the icon type is derived from that same model. The external string boundary remains visible only in `createToastManager`.

```ts
/**
 * The toast presentations owned by the application.
 */
const TOAST_TYPES = [
  "success",
  "info",
  "warning",
  "error",
  "loading",
] as const;

/**
 * A presentation supported by the application toast system.
 */
type ToastType = (typeof TOAST_TYPES)[number];

/**
 * The open options accepted by the external toast library.
 */
interface ExternalToastOptions {
  title: string;
  type?: string;
}

/**
 * The external toast capability supplied by the library.
 */
interface ExternalToastManager {
  /**
   * Adds a toast using the library's extensible presentation name.
   *
   * @param options - The external toast content and presentation.
   * @returns The new toast identifier.
   */
  add: (options: ExternalToastOptions) => string;
}

/**
 * The application-owned toast options exposed to callers.
 */
type ToastOptions = Omit<ExternalToastOptions, "type"> & {
  type?: ToastType;
};

/**
 * The application-owned view of the external toast manager.
 */
type ToastManager = Omit<ExternalToastManager, "add"> & {
  add: (options: ToastOptions) => string;
};

/**
 * The non-empty presentation consumed by the toast icon.
 */
type ToastIconType = NonNullable<ToastOptions["type"]>;

/**
 * Narrows an external manager to the application contract.
 *
 * The external function accepts a superset of the application's options, so
 * exposing only the narrower input preserves every runtime call it receives.
 *
 * @param externalManager - The external manager hidden behind the application API.
 * @returns A manager that rejects unsupported presentations from callers.
 */
const createToastManager = (
  externalManager: ExternalToastManager
): ToastManager => externalManager;
```

## Domain Identifiers

### NEGATIVE — Aliases rename strings without making identities distinct

**Decisive evidence:** Both aliases remain structurally identical, so reversing the arguments still typechecks.

```ts
/**
 * A user identifier that remains interchangeable with every string.
 */
type UserId = string;

/**
 * A product identifier that remains interchangeable with every string.
 */
type ProductId = string;

/**
 * Associates one product with one user.
 *
 * @param userId - The user receiving the product.
 * @param productId - The product assigned to the user.
 */
declare function assignProduct(userId: UserId, productId: ProductId): void;
```

### POSITIVE — Schemas own distinct validated identities

**Decisive evidence:** Each schema both validates the runtime UUID and produces a distinct inferred brand. The API receives named branded fields, so swapping the values fails before execution.

```ts
import { z } from "zod";

/**
 * Validates and brands user identifiers at their owning input boundary.
 */
const userIdSchema = z.uuid().brand<"UserId">();

/**
 * A validated identifier for one user.
 */
type UserId = z.infer<typeof userIdSchema>;

/**
 * Validates and brands product identifiers at their owning input boundary.
 */
const productIdSchema = z.uuid().brand<"ProductId">();

/**
 * A validated identifier for one product.
 */
type ProductId = z.infer<typeof productIdSchema>;

/**
 * The identities required to assign a product.
 */
interface ProductAssignment {
  productId: ProductId;
  userId: UserId;
}

/**
 * Associates one validated product with one validated user.
 *
 * @param assignment - The distinct product and user identities.
 */
declare function assignProduct(assignment: ProductAssignment): void;
```

## Results, State, And Absence

### NEGATIVE — Optional fields permit contradictory states

**Decisive evidence:** The local result can be successful without data, failed without an error, or contain data and an error together. `Partial<Profile>` also permits inputs this operation does not own, and `avatar?` conflates an omitted stable field with a known absent value.

```ts
/**
 * A profile whose stable avatar field can disappear from the object.
 */
interface Profile {
  avatar?: string;
  displayName: string;
  id: string;
}

/**
 * A loose local result that permits contradictory branches.
 */
interface SaveResult {
  data?: Profile;
  error?: string;
  ok: boolean;
}

/**
 * An update that accidentally grants access to every profile field.
 */
type SaveProfileInput = Partial<Profile>;
```

### POSITIVE — Repository primitives express each valid branch

**Decisive evidence:** The stable profile always carries its avatar field, the operation accepts only fields it owns, the shared `Result` carries a typed error, and the discriminated state exposes data only where it exists.

```ts
import type { Option } from "@workspace/utils/option";
import type { Result } from "@workspace/utils/result";

/**
 * A loaded profile with an intentionally absent or present avatar.
 */
interface Profile {
  avatar: Option<string>;
  displayName: string;
  id: string;
}

/**
 * The profile fields owned by the save operation.
 */
type SaveProfileInput = Pick<Profile, "avatar" | "displayName">;

/**
 * The complete set of valid profile-save states.
 */
type SaveProfileState =
  | { status: "idle" }
  | { status: "saving" }
  | { profile: Profile; status: "saved" }
  | { error: TypeError; status: "failed" };

/**
 * Persists the editable profile fields.
 *
 * @param input - The avatar and display name accepted by this operation.
 * @returns The saved profile or a validation failure.
 */
declare function saveProfile(
  input: SaveProfileInput
): Promise<Result<Profile, TypeError>>;
```
