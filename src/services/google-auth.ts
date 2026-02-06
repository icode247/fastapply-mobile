/**
 * Google Sign-In helper — uses dynamic require() so the native module
 * is only loaded when the user actually taps "Continue with Google",
 * preventing crashes if the module isn't available in the binary
 * (e.g. Expo Go or missing prebuild).
 */

let configured = false;

function getGoogleSignin() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {
    GoogleSignin,
    isSuccessResponse,
  } = require("@react-native-google-signin/google-signin");
  return { GoogleSignin, isSuccessResponse };
}

function ensureConfigured() {
  if (configured) return;
  const { GoogleSignin } = getGoogleSignin();
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    offlineAccess: true,
  });
  configured = true;
}

/**
 * Initiates Google Sign-In and returns the server auth code
 * for the backend to exchange for tokens.
 *
 * Returns `null` if the user cancels the sign-in flow.
 * Throws on other errors (play services unavailable, etc.).
 */
export async function googleSignIn(): Promise<string | null> {
  ensureConfigured();
  const { GoogleSignin, isSuccessResponse } = getGoogleSignin();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    // User cancelled
    return null;
  }

  const { serverAuthCode } = response.data;
  if (!serverAuthCode) {
    throw new Error(
      "No server auth code received. Ensure webClientId and offlineAccess are configured."
    );
  }

  return serverAuthCode;
}

/**
 * Signs the user out of Google (clears cached session).
 * Call this if the backend sign-in fails so the user can retry with a fresh session.
 */
export async function googleSignOut(): Promise<void> {
  try {
    const { GoogleSignin } = getGoogleSignin();
    await GoogleSignin.signOut();
  } catch {
    // Ignore sign-out errors
  }
}
