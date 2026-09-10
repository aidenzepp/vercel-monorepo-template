import { z } from "zod";

/**
 * Better Auth-owned OAuth redirect error codes recognized by this package.
 * Provider and application-hook error codes are intentionally excluded.
 *
 * @see https://better-auth.com/docs/reference/errors
 * @see https://github.com/better-auth/better-auth/blob/v1.7.2/packages/better-auth/src/oauth2/errors.ts
 */
const redirectErrorCode = {
  /**
   * The OAuth account is already linked to a different user.
   *
   * @see https://better-auth.com/docs/reference/errors/account_already_linked_to_different_user
   */
  accountAlreadyLinkedToDifferentUser:
    "account_already_linked_to_different_user",

  /**
   * Better Auth found the user but could not safely link the OAuth account.
   *
   * @see https://better-auth.com/docs/reference/errors/account_not_linked
   */
  accountNotLinked: "account_not_linked",

  /**
   * The OAuth account email does not match the email on the account being
   * linked. Better Auth 1.7.2 emits `email_does_not_match`; its documentation
   * currently labels the error `email_doesn't_match`.
   *
   * @see https://github.com/better-auth/better-auth/blob/v1.7.2/packages/better-auth/src/oauth2/errors.ts#L19
   * @see https://better-auth.com/docs/reference/errors/email_doesn't_match
   */
  emailDoesNotMatch: "email_does_not_match",

  /**
   * The OAuth provider did not return a usable email address.
   *
   * @see https://better-auth.com/docs/reference/errors/email_not_found
   */
  emailNotFound: "email_not_found",

  /**
   * The OAuth identity could not be accepted because its email is unverified.
   *
   * @see https://github.com/better-auth/better-auth/blob/v1.7.2/packages/better-auth/src/oauth2/link-account.ts#L273
   */
  emailNotVerified: "email_not_verified",

  /**
   * Better Auth encountered an unexpected failure during the OAuth flow.
   *
   * @see https://better-auth.com/docs/reference/errors/internal_server_error
   */
  internalServerError: "internal_server_error",

  /**
   * Better Auth could not parse the OAuth callback request.
   *
   * @see https://better-auth.com/docs/reference/errors/invalid_callback_request
   */
  invalidCallbackRequest: "invalid_callback_request",

  /**
   * The OAuth authorization code is invalid, expired, or could not be exchanged
   * for tokens.
   *
   * @see https://better-auth.com/docs/reference/errors/invalid_code
   */
  invalidCode: "invalid_code",

  /**
   * The callback issuer did not match the configured OAuth provider.
   *
   * @see https://github.com/better-auth/better-auth/blob/v1.7.2/packages/better-auth/src/oauth2/errors.ts#L15
   */
  issuerMismatch: "issuer_mismatch",

  /**
   * The OAuth response did not include the issuer required by the provider.
   *
   * @see https://github.com/better-auth/better-auth/blob/v1.7.2/packages/better-auth/src/oauth2/errors.ts#L14
   */
  issuerMissing: "issuer_missing",

  /**
   * Better Auth could not recover the application callback URL from state.
   *
   * @see https://better-auth.com/docs/reference/errors/no_callback_url
   */
  noCallbackUrl: "no_callback_url",

  /**
   * The OAuth callback did not include an authorization code.
   *
   * @see https://better-auth.com/docs/reference/errors/no_code
   */
  noCode: "no_code",

  /**
   * The provider required an ID-token nonce, but Better Auth could not recover
   * the expected nonce from state.
   *
   * @see https://github.com/better-auth/better-auth/blob/v1.7.2/packages/better-auth/src/oauth2/errors.ts#L17
   */
  nonceBindingMissing: "nonce_binding_missing",

  /**
   * Better Auth could not find the OAuth provider named by the callback route.
   *
   * @see https://better-auth.com/docs/reference/errors/oauth_provider_not_found
   */
  oauthProviderNotFound: "oauth_provider_not_found",

  /**
   * The OAuth identity requires a new user, but signup is disabled.
   *
   * @see https://better-auth.com/docs/reference/errors/signup_disabled
   */
  signupDisabled: "signup_disabled",

  /**
   * Better Auth could not parse the stored OAuth state.
   *
   * @see https://better-auth.com/docs/reference/errors/state_invalid
   */
  stateInvalid: "state_invalid",

  /**
   * The returned OAuth state did not match the state Better Auth issued.
   *
   * @see https://better-auth.com/docs/reference/errors/state_mismatch
   */
  stateMismatch: "state_mismatch",

  /**
   * The OAuth callback did not include state or its stored state was missing.
   *
   * @see https://better-auth.com/docs/reference/errors/state_not_found
   */
  stateNotFound: "state_not_found",

  /**
   * Better Auth created or found a user but could not create a session.
   *
   * @see https://better-auth.com/docs/reference/errors/unable_to_create_session
   */
  unableToCreateSession: "unable_to_create_session",

  /**
   * Better Auth could not create a user for the OAuth identity.
   *
   * @see https://better-auth.com/docs/reference/errors/unable_to_create_user
   */
  unableToCreateUser: "unable_to_create_user",

  /**
   * Better Auth could not obtain usable user information from the provider.
   *
   * @see https://better-auth.com/docs/reference/errors/unable_to_get_user_info
   */
  unableToGetUserInfo: "unable_to_get_user_info",

  /**
   * Better Auth could not link the OAuth account to the user.
   *
   * @see https://better-auth.com/docs/reference/errors/unable_to_link_account
   */
  unableToLinkAccount: "unable_to_link_account",
} as const;

const redirectErrorCodeSchema = z.enum(redirectErrorCode);

/** A Better Auth-owned OAuth redirect error recognized by this package. */
type RedirectErrorCode = z.infer<typeof redirectErrorCodeSchema>;

export { redirectErrorCode, redirectErrorCodeSchema };
export type { RedirectErrorCode };
