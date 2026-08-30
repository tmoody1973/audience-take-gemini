/**
 * Audience Take — Firebase Client & Admin SDK Configuration
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";

import { firebaseClientConfig } from "../lib/firebase/config";

const firebaseConfig = firebaseClientConfig;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

// Connect to emulators in development mode if configured
if (
  typeof window !== "undefined" &&
  (process.env.NEXT_PUBLIC_USE_EMULATORS === "true" || process.env.NODE_ENV === "development")
) {
  try {
    // Only connect once
    // @ts-expect-error internal emulator check
    if (!db._settingsFrozen) {
      connectFirestoreEmulator(db, "localhost", 8080);
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
      connectStorageEmulator(storage, "localhost", 9199);
    }
  } catch {
    // Emulators already connected or running in production mode
  }
}

export { app, auth, db, storage };
