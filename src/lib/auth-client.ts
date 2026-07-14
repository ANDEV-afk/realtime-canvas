import { createAuthClient } from "better-auth/client";
const authClient = createAuthClient();

export const signInWithGoogle = async () => {
  const data = await authClient.signIn.social({
    provider: "google",
  });
  return data;
};

export const { signIn, signUp, signOut, useSession } = createAuthClient();