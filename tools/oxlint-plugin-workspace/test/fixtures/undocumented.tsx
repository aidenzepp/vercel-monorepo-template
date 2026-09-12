const label = "Undocumented";

interface UserRecord {
  name: string;
}

class UserFormatter {
  /**
   * Reads the display value from a fixture user.
   *
   * @param user - The fixture user whose name should be displayed.
   * @returns The user's display name.
   */
  format(user: UserRecord) {
    return user.name;
  }
}

function Undocumented(user: UserRecord) {
  const formatLabel = (value: string) => `${label} ${value}`;
  const formatter = new UserFormatter();

  return <div>{formatLabel(formatter.format(user))}</div>;
}

export { Undocumented };
