import { beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";

beforeEach(() => {
  useAuthStore.setState({
    hydrated: true,
    user: {
      id: "test-user-id",
      fullName: "Test User",
      email: "test@ethiotech.org",
      role: "super_admin",
    },
    accessToken: "test-access-token",
  });
});
