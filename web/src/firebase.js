import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { firebaseConfig } from './firebaseConfig'

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// When VITE_USE_EMULATOR=true, connect to the local Firebase Emulator Suite.
// This lets the whole site run without a real Firebase project / login.
const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true'

if (useEmulator) {
  const host = import.meta.env.VITE_EMULATOR_HOST || 'localhost'
  try {
    connectFirestoreEmulator(db, host, 8080)
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
    // eslint-disable-next-line no-console
    console.info('[firebase] Connected to local emulators on', host)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[firebase] Emulator connection skipped:', e?.message)
  }
}

export const IS_EMULATOR = useEmulator
