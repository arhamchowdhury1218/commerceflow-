// ─── IMPORTS ────────────────────────────────────────────────────────────────

import { create } from "zustand";
// create() is the main Zustand function
// It creates a "store" — a global object any component can read and update

import { persist } from "zustand/middleware";
// persist() is middleware that automatically saves store data to localStorage
// WHY? Without persist, if the user refreshes the page, they get logged out
// With persist, the token survives page refreshes — user stays logged in

// ─── STORE DEFINITION ───────────────────────────────────────────────────────

const useAuthStore = create(
  // We wrap create() with persist() so state survives page refreshes
  persist(
    // set is a function Zustand gives us to UPDATE state
    (set) => ({
      // ── STATE ─────────────────────────────────────────────────────────────
      // These are the global variables any component can read

      token: null,
      // The Bearer token from Laravel Sanctum
      // null means "not logged in"
      // When set, means "logged in and ready to make API calls"

      user: null,
      // The user object from Laravel: { id, name, email, role, ... }
      // Used to show the seller's name in the sidebar
      // Used to check permissions

      // ── ACTIONS ───────────────────────────────────────────────────────────
      // These are functions that UPDATE the state
      // set({ key: value }) merges the new value into state

      setToken: (token) => set({ token }),
      // Called right after login succeeds
      // Example usage: useAuthStore.getState().setToken('abc123...')

      setUser: (user) => set({ user }),
      // Called after login to store the user's name, email, etc.
      // Example usage: setUser({ id: 1, name: 'Rahim', email: 'rahim@gmail.com' })

      logout: () => set({ token: null, user: null }),
      // Clears BOTH token and user at once
      // Called when seller clicks "Logout"
      // persist middleware automatically removes it from localStorage too
    }),

    // ── PERSIST CONFIG ──────────────────────────────────────────────────────
    {
      name: "commerceflow-auth",
      // This is the key used in localStorage
      // Open browser DevTools → Application → Local Storage to see it
      // Only token and user are saved — nothing sensitive beyond that
    },
  ),
);

export default useAuthStore;

// ─── HOW TO USE IN ANY COMPONENT ────────────────────────────────────────────
//
// READ state:
//   const { token, user } = useAuthStore()
//
// UPDATE state:
//   const { setToken, setUser, logout } = useAuthStore()
//   setToken('abc123')
//   setUser({ name: 'Rahim', email: 'rahim@gmail.com' })
//   logout()
//
// That's it. No Redux boilerplate, no Provider wrappers, no dispatch/actions.
