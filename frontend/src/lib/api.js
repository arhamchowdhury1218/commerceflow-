// ─── IMPORTS ────────────────────────────────────────────────────────────────

import axios from "axios";
// axios is the HTTP client library
// It makes GET, POST, PUT, DELETE requests to our Laravel API

// ─── CREATE AXIOS INSTANCE ──────────────────────────────────────────────────

// WHY create an instance instead of using axios directly?
// So we configure baseURL and headers ONCE here
// Every other file just does: api.get('/orders') — clean and simple
// No need to type the full URL or headers every time

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  // import.meta.env.VITE_API_URL reads from the .env file in the frontend folder
  // In development: http://127.0.0.1:8000/api
  // In production:  https://yourapp.com/api  (just change the .env file)
  // The || means "if the env variable doesn't exist, use this default"

  headers: {
    "Content-Type": "application/json",
    // Tell Laravel: "I am sending JSON data"
    Accept: "application/json",
    // Tell Laravel: "Please send me JSON back"
    // Without these headers, Laravel might return HTML instead of JSON
  },

  withCredentials: true,
  // Required for Laravel Sanctum to work
  // Allows cookies to be sent with cross-origin requests
});

// ─── REQUEST INTERCEPTOR ────────────────────────────────────────────────────

// An interceptor runs automatically BEFORE every request
// Perfect place to attach the auth token
// Without this, you'd have to manually add the token in every single api call

api.interceptors.request.use(
  (config) => {
    // Get the auth data that Zustand saved to localStorage
    const stored = localStorage.getItem("commerceflow-auth");

    if (stored) {
      const parsed = JSON.parse(stored);
      const token = parsed?.state?.token;
      // Zustand persist saves data as: { state: { token: '...', user: {...} } }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Attach the token to the Authorization header
        // Laravel Sanctum reads this header on every request
        // to know which seller is making the request
      }
    }

    return config;
    // Always return config — this continues the request
  },
  (error) => Promise.reject(error),
  // If something went wrong building the request, reject it
);

// ─── RESPONSE INTERCEPTOR ───────────────────────────────────────────────────

// Runs automatically AFTER every response comes back from Laravel
// Perfect for handling errors globally

api.interceptors.response.use(
  (response) => response,
  // SUCCESS: just pass the response through unchanged

  (error) => {
    if (error.response?.status === 401) {
      // 401 = "Unauthorized" — token is expired or invalid
      // Force the user to log in again
      localStorage.removeItem("commerceflow-auth");
      // Clear the invalid token from localStorage

      window.location.href = "/login";
      // Redirect to login page
      // We use window.location here (not React Router) because
      // this file is outside React components and can't use useNavigate()
    }

    return Promise.reject(error);
    // Pass the error along so components can handle specific errors too
  },
);

export default api;

// ─── HOW TO USE IN ANY COMPONENT ────────────────────────────────────────────
//
// import api from '@/lib/api'
//
// GET:    const res = await api.get('/orders')
// POST:   const res = await api.post('/orders', { customer_id: 1, ... })
// PUT:    const res = await api.put('/orders/5', { status: 'confirmed' })
// DELETE: const res = await api.delete('/orders/5')
//
// The token is attached automatically — you never think about it again
