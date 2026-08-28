export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyApiKeyForLiveScouting",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "test-app-mkark4.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "test-app-mkark4",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "test-app-mkark4.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "866111144888",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:866111144888:web:audience-take",
};

export function hasFirebaseClientConfig(): boolean {
  return true;
}

export const firebaseEmulatorConfig = {
  enabled: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true",
  host: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1",
  authPort: Number(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || 9099),
  firestorePort: Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || 8080),
  storagePort: Number(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT || 9199),
};
