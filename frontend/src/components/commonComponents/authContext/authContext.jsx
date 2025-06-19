import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import request from "../../../utils/request";

// Initial state
const initialState = {
  user: null,
  loading: false,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_USER: "SET_USER",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  LOGOUT: "LOGOUT",
  UPDATE_USER: "UPDATE_USER",
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null,
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  React.useEffect(() => {
    const storedUser = request.utils.getStoredUser();
    if (storedUser) {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: storedUser });
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const result = await request.auth.register(userData);

      if (result.success) {
        const user = result.data.data.user;
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        request.utils.updateStoredUser(user);
        toast.success("Account created successfully! Welcome to Chat App!");
        return { success: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = "Registration failed. Please try again.";
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const result = await request.auth.login(credentials);

      if (result.success) {
        const user = result.data.data.user;
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        request.utils.updateStoredUser(user);
        toast.success(`Welcome back, ${user.firstName}!`);
        return { success: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = "Login failed. Please check your credentials.";
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async (logoutAll = false) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

    try {
      if (logoutAll) {
        await request.auth.logoutAll();
        toast.success("Logged out from all devices");
      } else {
        await request.auth.logout();
        toast.success("Logged out successfully");
      }
    } catch (error) {
      // Even if logout fails, we clear local data
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      request.utils.clearAuthData();
    }
  }, []);

  // Check auth function (verify token and get current user)
  const checkAuth = useCallback(async () => {
    if (!request.utils.isAuthenticated()) {
      return false;
    }

    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

    try {
      const result = await request.auth.getCurrentUser();

      if (result.success) {
        const user = result.data.data.user;
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        request.utils.updateStoredUser(user);
        return true;
      } else {
        // Token is invalid, clear auth data
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        request.utils.clearAuthData();
        return false;
      }
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      request.utils.clearAuthData();
      return false;
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const result = await request.user.updateProfile(profileData);

      if (result.success) {
        const updatedUser = result.data.data.user;
        dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedUser });
        request.utils.updateStoredUser(updatedUser);
        toast.success("Profile updated successfully");
        return { success: true, user: updatedUser };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = "Failed to update profile. Please try again.";
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (passwordData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const result = await request.auth.changePassword(passwordData);

      if (result.success) {
        // Password changed successfully, user needs to login again
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        request.utils.clearAuthData();
        toast.success("Password changed successfully. Please login again.");
        return { success: true, requireRelogin: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = "Failed to change password. Please try again.";
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Context value
  const value = {
    // State
    user: state.user,
    loading: state.loading,
    error: state.error,

    // Actions
    register,
    login,
    logout,
    checkAuth,
    updateProfile,
    changePassword,
    clearError,

    // Computed values
    isAuthenticated: !!state.user,
    userInitials: state.user
      ? `${state.user.firstName?.[0] || ""}${
          state.user.lastName?.[0] || ""
        }`.toUpperCase()
      : "",
    userDisplayName: state.user
      ? `${state.user.firstName} ${state.user.lastName}`.trim()
      : "",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;
