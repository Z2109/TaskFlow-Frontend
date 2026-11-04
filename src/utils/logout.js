
import { toast } from "react-toastify";

export function logoutUser(router) {
  try {
    const keysToRemove = [
      "token",
      "user",
      "userName",
      "name",
      "userRole",
      "userEmail",
      "organizationId",
      "organizationName",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Clear session data
    sessionStorage.clear();

    toast.success("Logged out successfully!");

    // Redirect to login
    router.replace("/login");
    router.refresh();

  } catch (error) {
    console.error("Logout error:", error);
    toast.error("Unable to logout. Please try again.");
  }
}
