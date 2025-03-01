import { Account, Avatars, Client, OAuthProvider } from "react-native-appwrite";
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";

export const config = {
  platform: "com.jsm.restate",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
};

export const client = new Client();

client
  .setEndpoint(config.endpoint!)
  .setProject(config.projectId!)
  .setPlatform(config.platform!);

export const avatar = new Avatars(client); // allows to create new avatars
export const account = new Account(client); // allows to create new user accounts
// export const databases = new Databases(client);
// export const storage = new Storage(client);

export async function login() {
  try {
    const redirectUri = Linking.createURL("/");

    // request for an OAuth token from appwrite
    const response = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri
    );

    if (!response) throw new Error("Create OAuth2 token failed");

    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectUri
    );

    if (browserResult?.type !== "success")
      throw new Error("Create OAuth2 token failed");

    const url = new URL(browserResult?.url);
    const secret = url.searchParams.get("secret")?.toString();
    const userId = url.searchParams.get("userId")?.toString();
    if (!secret || !userId) throw new Error("Create OAuth2 token failed");

    // create a new session
    const session = await account.createSession(userId, secret);
    if (!session) throw new Error("Failed to create session");

    return true;
  } catch (error) {
    console.log({ error });
    return false;
  }
}

export async function logout() {
  try {
    const result = await account.deleteSession("current");
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const result = await account.get();
    console.log({ result });
    if (result?.$id) {
      const userAvatar = avatar?.getInitials(result?.name);

      return {
        ...result,
        avatar: userAvatar?.toString(),
      };
    }

    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
}
