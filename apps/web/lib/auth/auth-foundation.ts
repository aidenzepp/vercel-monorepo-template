import { apiKey } from "@better-auth/api-key";
import { passkey } from "@better-auth/passkey";
import { openAPI } from "better-auth/plugins";
import { anonymous } from "better-auth/plugins/anonymous";
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import { username } from "better-auth/plugins/username";
import type { BetterAuthOptions } from "better-auth/types";

import { usernamePluginOptions } from "@/lib/auth/username";

type AuthEmailMessage = Readonly<{
  subject: string;
  text: string;
  to: string;
}>;

type SendAuthEmail = (message: AuthEmailMessage) => Promise<void> | void;

type AuthFoundationOptions = Readonly<{
  appName: string;
  baseURL: string;
  sendEmail: SendAuthEmail;
}>;

const createAuthFoundationPlugins = ({
  appName,
  baseURL,
  sendEmail,
}: AuthFoundationOptions) => [
  anonymous(),
  apiKey(),
  organization({
    sendInvitationEmail: async ({ email, invitation, organization: team }) => {
      const invitationURL = new URL("/accept-invitation", baseURL);
      invitationURL.searchParams.set("invitationId", invitation.id);

      await sendEmail({
        subject: `Join ${team.name}`,
        text: `You were invited to join ${team.name}. Accept the invitation: ${invitationURL.toString()}`,
        to: email,
      });
    },
  }),
  passkey(),
  twoFactor({
    allowPasswordless: true,
    issuer: appName,
    otpOptions: {
      sendOTP: async ({ otp, user }) => {
        await sendEmail({
          subject: `${appName} verification code`,
          text: `Your verification code is ${otp}.`,
          to: user.email,
        });
      },
      storeOTP: "encrypted",
    },
  }),
  username(usernamePluginOptions),
  openAPI(),
];

const createEmailAndPasswordOptions = ({
  appName,
  sendEmail,
}: Pick<AuthFoundationOptions, "appName" | "sendEmail">) =>
  ({
    enabled: true,
    maxPasswordLength: 256,
    minPasswordLength: 12,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ url, user }) => {
      await sendEmail({
        subject: `Reset your ${appName} password`,
        text: `Reset your password: ${url}`,
        to: user.email,
      });
    },
  }) satisfies NonNullable<BetterAuthOptions["emailAndPassword"]>;

const createEmailVerificationOptions = ({
  appName,
  sendEmail,
}: Pick<AuthFoundationOptions, "appName" | "sendEmail">) =>
  ({
    sendOnSignUp: true,
    sendVerificationEmail: async ({ url, user }) => {
      await sendEmail({
        subject: `Verify your ${appName} email address`,
        text: `Verify your email address: ${url}`,
        to: user.email,
      });
    },
  }) satisfies NonNullable<BetterAuthOptions["emailVerification"]>;

export {
  createAuthFoundationPlugins,
  createEmailAndPasswordOptions,
  createEmailVerificationOptions,
};
export type { AuthEmailMessage, SendAuthEmail };
