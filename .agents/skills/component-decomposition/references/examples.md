# Component Decomposition Examples

Use these examples as labeled acceptance data. The text immediately above each snippet states the evidence that determines its label.

## Boundary and feature responsibilities

### NEGATIVE — One component hides several independently changeable jobs

**Decisive evidence:** This component reads application state, performs persistence and navigation, renders two fields, and owns submission presentation. Calling the aggregate job “edit a profile” does not make those responsibilities singular. Its 90-line size and single use are irrelevant.

```tsx
const ProfileSettingsForm = () => {
  const { user } = useSession();
  const router = useRouter();
  const form = useForm({ defaultValues: user });

  const saveProfile = form.handleSubmit(async (settings) => {
    await authClient.updateUser(settings);
    router.refresh();
  });

  return (
    <form onSubmit={saveProfile}>
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input {...form.register("name")} />
      </Field>
      <Field>
        <FieldLabel>Username</FieldLabel>
        <Input {...form.register("username")} />
      </Field>
      <Button loading={form.formState.isSubmitting}>Save</Button>
    </form>
  );
};
```

### POSITIVE — A named boundary supplies a prop-driven component family

**Decisive evidence:** The boundary alone reads the session and auth client. The form owns form coordination, `ProfileFormRow` owns the shared accessible field structure, each field owns one semantic input, and the action owns submit presentation. React Hook Form context is appropriate here because the leaves participate in the form protocol rather than acquire application data.

```tsx
import type { ReactNode } from "react";
import type { FieldError as HookFormFieldError } from "react-hook-form";

type ProfileSettings = {
  name: string;
  username: string;
};

interface ProfileFormRowProps {
  children: ReactNode;
  controlId: string;
  description: string;
  error?: HookFormFieldError;
  label: string;
}

interface ProfileSettingsFormProps {
  user: ProfileSettings;
  onSave: (profile: ProfileSettings) => Promise<void>;
}

const ProfileFormRow = ({
  children,
  controlId,
  description,
  error,
  label,
}: ProfileFormRowProps) => (
  <Field data-invalid={error !== undefined}>
    <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
    {children}
    <FieldDescription id={`${controlId}-description`}>
      {description}
    </FieldDescription>
    <FieldError
      errors={error === undefined ? [] : [error]}
      id={`${controlId}-error`}
    />
  </Field>
);

const ProfileNameInput = ({ placeholder }: { placeholder?: string }) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<ProfileSettings>();
  const controlId = "profile-name";

  return (
    <ProfileFormRow
      controlId={controlId}
      description="Shown throughout the application."
      error={errors.name}
      label="Name"
    >
      <Input
        {...register("name")}
        aria-describedby={`${controlId}-description`}
        aria-errormessage={
          errors.name === undefined ? undefined : `${controlId}-error`
        }
        aria-invalid={errors.name !== undefined}
        id={controlId}
        placeholder={placeholder}
      />
    </ProfileFormRow>
  );
};

const ProfileUsernameInput = ({ placeholder }: { placeholder?: string }) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<ProfileSettings>();
  const controlId = "profile-username";

  return (
    <ProfileFormRow
      controlId={controlId}
      description="Uniquely identifies this user."
      error={errors.username}
      label="Username"
    >
      <Input
        {...register("username")}
        aria-describedby={`${controlId}-description`}
        aria-errormessage={
          errors.username === undefined ? undefined : `${controlId}-error`
        }
        aria-invalid={errors.username !== undefined}
        id={controlId}
        placeholder={placeholder}
      />
    </ProfileFormRow>
  );
};

const ProfileSaveAction = () => {
  const { formState } = useFormContext<ProfileSettings>();
  return (
    <Button loading={formState.isSubmitting} type="submit">
      Save changes
    </Button>
  );
};

const ProfileSaveError = () => {
  const { formState } = useFormContext<ProfileSettings>();
  return formState.errors.root ? (
    <FieldError errors={[formState.errors.root]} />
  ) : null;
};

const ProfileSettingsForm = ({ onSave, user }: ProfileSettingsFormProps) => {
  const form = useForm<ProfileSettings>({ defaultValues: user });
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSave)}>
        <ProfileNameInput placeholder="Your name" />
        <ProfileUsernameInput placeholder="username" />
        <ProfileSaveError />
        <ProfileSaveAction />
      </form>
    </FormProvider>
  );
};

const ProfileSettingsFormBoundary = () => {
  const { user } = useSession();
  const saveProfile = async (profile: ProfileSettings) => {
    await authClient.updateUser(profile);
  };

  return (
    <ProfileSettingsForm
      onSave={saveProfile}
      user={{ name: user.name, username: user.username ?? "" }}
    />
  );
};
```

## Repeated structure

### NEGATIVE — Repetition is hidden inside separate leaves

**Decisive evidence:** Both fields independently recreate the same label-control-description structure. The wrapper is a repeated family concept, not incidental DOM arrangement inside one leaf.

```tsx
const ProfileNameInput = () => (
  <Field className="gap-2">
    <FieldLabel>Name</FieldLabel>
    <Input name="name" />
    <FieldDescription>Shown throughout the application.</FieldDescription>
  </Field>
);

const ProfileUsernameInput = () => (
  <Field className="gap-2">
    <FieldLabel>Username</FieldLabel>
    <Input name="username" />
    <FieldDescription>Uniquely identifies this user.</FieldDescription>
  </Field>
);
```

### POSITIVE — A named row owns the repeated family structure

**Decisive evidence:** `ProfileFormRow` has a stable structural contract used by multiple semantic fields. The fields still own their distinct controls and copy.

```tsx
import type { ReactNode } from "react";

const ProfileFormRow = ({
  children,
  controlId,
  description,
  label,
}: {
  children: ReactNode;
  controlId: string;
  description: string;
  label: string;
}) => (
  <Field className="gap-2">
    <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
    {children}
    <FieldDescription>{description}</FieldDescription>
  </Field>
);

const ProfileNameInput = () => (
  <ProfileFormRow
    controlId="profile-name"
    description="Shown throughout the application."
    label="Name"
  >
    <Input id="profile-name" name="name" />
  </ProfileFormRow>
);
```

### POSITIVE — Incidental arrangement stays inside its leaf

**Decisive evidence:** This wrapper only aligns the icon and text that constitute one action. It is neither repeated nor a separately named semantic region, so extracting `SignOutButtonContent` would add a name without a responsibility.

```tsx
const SignOutMenuItem = ({ onSignOut }: SignOutMenuItemProps) => (
  <DropdownMenuItem onClick={onSignOut}>
    <LogOut />
    <span>Sign out</span>
  </DropdownMenuItem>
);
```

## Primitive composition

### NEGATIVE — A Link impersonates the shared Button

**Decisive evidence:** The feature applies button variants directly to a Next.js link. It now owns interaction styling and can drift from the shared primitive.

```tsx
<Link
  className={buttonVariants({ color: "neutral", variant: "outline" })}
  href="/settings"
>
  Settings
</Link>
```

### POSITIVE — The Button renders the Link through its supported API

**Decisive evidence:** `Button` retains ownership of its intrinsic appearance and behavior while `Link` retains navigation semantics.

```tsx
<Button
  color="neutral"
  render={<Link href="/settings" />}
  variant="outline"
>
  Settings
</Button>
```

## Standard names

### NEGATIVE — Names describe vague implementation groupings

**Decisive evidence:** `Preview` and `Options` do not identify the Shadcn roles or the domain actions represented by these components.

```tsx
const SessionProfilePreview = () => null;
const SessionProfileOptions = () => null;
```

### POSITIVE — Names inherit domain and Shadcn vocabulary

**Decisive evidence:** `User` names the domain object; `Trigger`, `Content`, and `Item` state the composed Dropdown Menu roles; action items name their intent.

```tsx
const UserMenuTrigger = () => null;
const UserMenuContent = () => null;
const SettingsMenuItem = () => null;
const SignOutMenuItem = () => null;
```
