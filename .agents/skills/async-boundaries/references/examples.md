# Async Boundary Examples

These examples are labeled acceptance data. The evidence above each snippet is
the reason for its label. Apply the boundary decision rather than copying names
without understanding their responsibilities.

## Keep Known Content Outside

### NEGATIVE — A local boundary still hides too much

**Decisive evidence:** Only the profile values are unresolved, but the boundary
replaces the known card title, description, labels, and actions. Calling this
boundary “localized” does not make its scope correct.

```tsx
const SettingsPage = () => (
  <main>
    <SettingsHeader />
    <AsyncBoundary
      failure={<ProfileSettingsErrorCard />}
      loading={<ProfileSettingsLoadingCard />}
    >
      <ProfileSettingsCard />
    </AsyncBoundary>
  </main>
);
```

### POSITIVE — The boundary replaces only the unresolved form region

**Decisive evidence:** The card chrome is truthful before the read completes.
One profile read supplies both fields, so content, actions, loading, and failure
transition as one region beneath the stable header.

```tsx
/**
 * Displays the stable profile shell around its asynchronous form region.
 *
 * @returns The profile settings section with localized loading and failure states.
 */
const ProfileSettingsSection = () => (
  <Card>
    <ProfileSettingsHeader />
    <AsyncBoundary
      failure={<ProfileSettingsError />}
      loading={<ProfileSettingsLoading />}
    >
      <ProfileSettingsFields />
    </AsyncBoundary>
  </Card>
);
```

## Prefer Server Component Await

### NEGATIVE — Promise passing adds a Client boundary without a Client need

**Decisive evidence:** The client merely reads data and forwards its resolved
value to a form. `use()` provides no additional concurrency or interaction and
makes the Promise result cross the Server/Client boundary.

```tsx
// profile-settings-section.tsx
const ProfileSettingsSection = () => {
  const user = readProfile();

  return (
    <AsyncBoundary failure={<ProfileError />} loading={<ProfileLoading />}>
      <ProfileSettingsReader user={user} />
    </AsyncBoundary>
  );
};
```

```tsx
// profile-settings-reader.tsx
"use client";

const ProfileSettingsReader = ({ user }: { user: Promise<User> }) => (
  <ProfileSettingsForm user={use(user)} />
);
```

### POSITIVE — The async Server leaf resolves private data

**Decisive evidence:** The server leaf owns the read, suspends beneath its
nearest boundary, and gives the interactive form only the resolved fields it
needs.

```tsx
/**
 * Loads the public identity required by the profile form.
 *
 * @returns The interactive form initialized with server-validated profile data.
 */
const ProfileSettingsFields = async () => {
  const { user } = await requireSession();

  return (
    <ProfileSettingsForm
      user={{ name: user.name, username: user.username ?? "" }}
    />
  );
};
```

### POSITIVE — A Client consumer intentionally controls when the Promise is read

**Decisive evidence:** The server starts one stable Promise, while an
interactive Client Component reads it only after opening optional content. The
Promise is not recreated during client render.

```tsx
// activity-section.tsx
const ActivitySection = () => (
  <ActivityPopover activity={readActivity()} />
);
```

```tsx
// activity-popover.tsx
"use client";

const ActivityPopover = ({ activity }: { activity: Promise<Activity[]> }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" />}>Activity</PopoverTrigger>
      <PopoverContent>
        {open ? (
          <AsyncBoundary failure={<ActivityError />} loading={<ActivityLoading />}>
            <ActivityList activity={activity} />
          </AsyncBoundary>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};

const ActivityList = ({ activity }: { activity: Promise<Activity[]> }) => {
  const items = use(activity);

  return items.map((item) => <ActivityItem item={item} key={item.id} />);
};
```

## Avoid Waterfalls Without Merging Fates

### NEGATIVE — Sequential reads delay unrelated regions

**Decisive evidence:** Activity cannot begin loading until revenue resolves,
and one boundary makes two independent operations reveal and fail together.

```tsx
const Dashboard = async () => {
  const revenue = await readRevenue();
  const activity = await readActivity();

  return (
    <AsyncBoundary failure={<DashboardError />} loading={<DashboardLoading />}>
      <Revenue value={revenue} />
      <Activity items={activity} />
    </AsyncBoundary>
  );
};
```

### POSITIVE — Requests start together and retain independent boundaries

**Decisive evidence:** Both Promises start before either is awaited. Separate
boundaries let revenue render or fail without hiding activity, and vice versa.

```tsx
const Dashboard = () => {
  const revenue = readRevenue();
  const activity = readActivity();

  return (
    <DashboardLayout
      activity={
        <AsyncBoundary failure={<ActivityError />} loading={<ActivityLoading />}>
          <Activity activity={activity} />
        </AsyncBoundary>
      }
      revenue={
        <AsyncBoundary failure={<RevenueError />} loading={<RevenueLoading />}>
          <Revenue revenue={revenue} />
        </AsyncBoundary>
      }
    />
  );
};

const Revenue = async ({ revenue }: { revenue: Promise<RevenueData> }) => (
  <RevenueChart data={await revenue} />
);

const Activity = async ({ activity }: { activity: Promise<ActivityData> }) => (
  <ActivityFeed data={await activity} />
);
```

## Keep Atomic Results Together

### NEGATIVE — Per-field boundaries invent states the data cannot have

**Decisive evidence:** One profile request supplies both values. Separate
fallbacks suggest that one field can truthfully become ready while the other is
still pending.

```tsx
<Suspense fallback={<NameLoading />}>
  <ProfileNameInput profile={profile} />
</Suspense>
<Suspense fallback={<UsernameLoading />}>
  <ProfileUsernameInput profile={profile} />
</Suspense>
```

### POSITIVE — One boundary owns one shared result

**Decisive evidence:** Both inputs initialize, reset, submit, and fail from the
same profile value, so they share one loading and failure fate.

```tsx
<AsyncBoundary failure={<ProfileFieldsError />} loading={<ProfileFieldsLoading />}>
  <ProfileFields profile={profile} />
</AsyncBoundary>
```

## Keep Mutation Errors With The Interaction

### NEGATIVE — An Error Boundary is expected to catch an event-handler failure

**Decisive evidence:** Rendering boundaries do not catch arbitrary asynchronous
callback failures. The rejected save Promise escapes the interaction that needs
to preserve edits and display repair guidance.

```tsx
<ErrorBoundary fallback={<ProfileSaveError />}>
  <Button onClick={() => saveProfile(profile)}>Save changes</Button>
</ErrorBoundary>
```

### POSITIVE — Action state owns submission progress and failure

**Decisive evidence:** The form that initiates the mutation retains the pending
state, preserves the entered values, and displays the actionable failure.

```tsx
const ProfileSaveAction = ({ onSave }: ProfileSaveActionProps) => {
  const [error, action, pending] = useActionState(onSave, null);

  return (
    <Form action={action}>
      <ProfileFields disabled={pending} />
      {error === null ? null : <FieldError>{error}</FieldError>}
      <Button loading={pending} type="submit">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </Form>
  );
};
```

## Keep Fallbacks Cheap

### NEGATIVE — The fallback repeats asynchronous work

**Decisive evidence:** If `ProfileSettings` suspends or fails, its fallback
starts another profile read and can suspend or fail into an ancestor boundary.

```tsx
<Suspense fallback={<ProfileSummary user={await readProfile()} />}>
  <ProfileSettings />
</Suspense>
```

### POSITIVE — The fallback depends only on known presentation

**Decisive evidence:** The skeleton preserves the unresolved controls' geometry
without data access. Known labels and descriptions remain outside this fallback.

```tsx
const ProfileFieldsLoading = () => (
  <CardContent aria-busy="true" aria-label="Loading profile settings">
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-full" />
  </CardContent>
);
```
