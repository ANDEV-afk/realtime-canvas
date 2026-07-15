import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const AUTH_REDIRECT_PATH = "/workspace";

export const signInWithGoogle = (callbackURL = AUTH_REDIRECT_PATH) =>
  authClient.signIn.social({
    provider: "google",
    callbackURL,
  });

export const { signIn, signUp, signOut, useSession } = authClient;
