
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,

    reducers: {
        // Store user information after successful login
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
        },

        // Logout user
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
        },

        // Clear authentication errors
        clearAuthError: (state) => {
            state.error = null;
        },

        // Update loading state
        setAuthLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const {
    setCredentials,
    logout,
    clearAuthError,
    setAuthLoading,
} = authSlice.actions;

export default authSlice.reducer;
