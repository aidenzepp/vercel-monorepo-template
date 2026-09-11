# Code Documentation Examples

Use these examples as labeled acceptance data. The text immediately above each snippet states the evidence that determines its label.

## Props, callbacks, and components

### NEGATIVE — Polished restatement leaves the contract undocumented

**Decisive evidence:** The interface and property comments merely repeat their names. The component repeats TypeScript types, omits the destructured property tag, calls its result “JSX,” and adds an `@see` link that conveys nothing beyond the signature.

```tsx
/** Profile name input props. */
interface ProfileNameInputProps {
  /** The placeholder. */
  placeholder?: string;
}

/**
 * The ProfileNameInput component.
 *
 * @param {ProfileNameInputProps} props - The props.
 * @returns {JSX.Element} The JSX element.
 * @see {@link ProfileNameInputProps}
 */
const ProfileNameInput = ({ placeholder }: ProfileNameInputProps) => (
  <Input placeholder={placeholder} />
);
```

### POSITIVE — Documentation states the consumer-facing contract once

**Decisive evidence:** The props type owns the full property meaning. The component tags explain how the object and property participate here without copying that property comment, and the return describes the rendered responsibility.

```tsx
/** The presentation values accepted by the profile name field. */
interface ProfileNameInputProps {
  /** The hint displayed while the name control has no value. */
  placeholder?: string;
}

/**
 * Displays the name control registered by the surrounding profile form.
 *
 * @param props - The presentation values for the name field.
 * @param props.placeholder - Supplies the control's empty-state hint.
 * @returns The editable name field used by profile settings.
 */
const ProfileNameInput = ({ placeholder }: ProfileNameInputProps) => (
  <Input name="name" placeholder={placeholder} />
);
```

### POSITIVE — A callback property documents its capability and completion

**Decisive evidence:** The interface defines the family boundary, the `user` property states the subset's role, and `onSave` explains both the intent of its argument and what promise completion guarantees.

```tsx
/** The values and persistence capability required by profile settings. */
interface ProfileSettingsFormProps {
  /** The current public identity used to initialize the editable fields. */
  user: Pick<User, "name" | "username">;
  /**
   * Persists an edited public identity through the owning application boundary.
   *
   * @param profile - The validated name and username to persist.
   * @returns A promise that settles after the saved identity becomes observable.
   */
  onSave: (profile: ProfileSettings) => Promise<void>;
}
```

## File-local helpers and module constants

### NEGATIVE — Documentation decorates names without adding a contract

**Decisive evidence:** These comments only turn identifiers into sentences. They do not state which layers share the limit or what normalization guarantees.

```ts
/** The maximum username length. */
const MAX_USERNAME_LENGTH = 32;

/** Normalizes a username. */
const normalizeUsername = (value: string) => value.trim().toLowerCase();
```

### POSITIVE — Concise comments explain system role and guarantee

**Decisive evidence:** The constant identifies the consumers that must agree. The helper documents its input meaning and exact semantic result without optional tag filler.

```ts
/** The largest username accepted by both form validation and Better Auth. */
const MAX_USERNAME_LENGTH = 32;

/**
 * Converts a user-entered username to its comparison form.
 *
 * @param value - The username exactly as entered by the user.
 * @returns The trimmed, lowercase username used for validation and uniqueness.
 */
const normalizeUsername = (value: string) => value.trim().toLowerCase();
```

## Overload sets

### NEGATIVE — Shared boilerplate obscures distinct overload contracts

**Decisive evidence:** The overload comments do not distinguish accepted formats or results, while the implementation signature receives a third redundant comment.

```ts
/** Parses a profile. */
export function parseProfile(value: string): Profile;

/** Parses a profile. */
export function parseProfile(value: URLSearchParams): Partial<Profile>;

/** Parses a profile. */
export function parseProfile(
  value: string | URLSearchParams
): Profile | Partial<Profile> {
  // ...
}
```

### POSITIVE — Each public overload owns its differing contract

**Decisive evidence:** Each public signature documents its own input format, result guarantee, and escaping failure. The implementation signature has no separate comment because it is not another public contract.

```ts
/**
 * Parses a complete profile from its compact serialized representation.
 *
 * @param value - A pipe-delimited display name and username.
 * @returns The complete profile with a normalized username.
 * @throws {RangeError} When either required field is absent.
 */
export function parseProfile(value: string): Profile;

/**
 * Parses the profile fields present in submitted search parameters.
 *
 * @param value - Parameters containing optional name and username fields.
 * @returns The non-empty submitted fields with a normalized username.
 */
export function parseProfile(value: URLSearchParams): Partial<Profile>;

export function parseProfile(
  value: string | URLSearchParams
): Profile | Partial<Profile> {
  // ...
}
```

## Optional tags

### NEGATIVE — Optional tags are present only to look complete

**Decisive evidence:** The relationship is already obvious from the parameter type, the usage is ordinary, and no error escapes. These tags add no navigation or contract information.

```ts
/**
 * Displays the user menu.
 *
 * @param props - The menu values.
 * @returns The user menu.
 * @see {@link UserMenuProps}
 * @example
 * <UserMenu user={user} />
 * @throws Never.
 */
const UserMenu = (props: UserMenuProps) => null;
```

### POSITIVE — Optional tags appear only where they change understanding

**Decisive evidence:** The link identifies the client-side counterpart that receives this server-validated value. Ordinary usage needs no example tag, and redirecting an unauthenticated request is described as control flow rather than a fictional thrown error.

```ts
/**
 * Returns the authenticated session required by a protected server boundary.
 *
 * Unauthenticated requests transfer control to the sign-in page.
 *
 * @returns The non-null session exposed to the protected subtree.
 * @see {@link SessionProvider}
 */
const requireSession = async (): Promise<Session> => {
  // ...
};
```
