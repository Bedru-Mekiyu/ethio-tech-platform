import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { GuestRoute } from "@/routes/GuestRoute";
import { useAuthStore, type AuthUser } from "@/store/authStore";

const mockStudentUser: AuthUser = {
  id: "student-1",
  fullName: "Abebe Kebede",
  email: "student@ethiotech.org",
  role: "student",
};

const mockMentorUser: AuthUser = {
  id: "mentor-1",
  fullName: "Dr. Henok Tesfaye",
  email: "mentor@ethiotech.org",
  role: "mentor",
};

const mockAdminUser: AuthUser = {
  id: "admin-1",
  fullName: "Platform Admin",
  email: "admin@ethiotech.org",
  role: "admin",
};

describe("Route Guards Test Suite", () => {
  beforeEach(() => {
    useAuthStore.setState({
      hydrated: true,
      user: null,
      accessToken: null,
    });
  });

  describe("ProtectedRoute", () => {
    it("redirects unauthenticated user to /login", () => {
      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute roles={["student"]}>
                  <div>Protected Student Space</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page Mock</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Login Page Mock")).toBeTruthy();
      expect(screen.queryByText("Protected Student Space")).toBeNull();
    });

    it("redirects unauthorized role to /", () => {
      useAuthStore.setState({
        hydrated: true,
        user: mockStudentUser,
        accessToken: "valid-token-123",
      });

      render(
        <MemoryRouter initialEntries={["/admin-only"]}>
          <Routes>
            <Route
              path="/admin-only"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <div>Admin Secret Area</div>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<div>Home Page Mock</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Home Page Mock")).toBeTruthy();
      expect(screen.queryByText("Admin Secret Area")).toBeNull();
    });

    it("allows authorized role access to protected content", () => {
      useAuthStore.setState({
        hydrated: true,
        user: mockStudentUser,
        accessToken: "valid-token-123",
      });

      render(
        <MemoryRouter initialEntries={["/student-dashboard"]}>
          <Routes>
            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute roles={["student"]}>
                  <div>Student Learning Space</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Student Learning Space")).toBeTruthy();
    });
  });

  describe("GuestRoute", () => {
    it("allows guest user to view login/register page", () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <div>Auth Form Content</div>
                </GuestRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Auth Form Content")).toBeTruthy();
    });

    it("redirects authenticated student to /app/dashboard", () => {
      useAuthStore.setState({
        hydrated: true,
        user: mockStudentUser,
        accessToken: "valid-token-123",
      });

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <div>Auth Form Content</div>
                </GuestRoute>
              }
            />
            <Route path="/app/dashboard" element={<div>Student Home Area</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Student Home Area")).toBeTruthy();
      expect(screen.queryByText("Auth Form Content")).toBeNull();
    });

    it("redirects authenticated mentor to /mentor", () => {
      useAuthStore.setState({
        hydrated: true,
        user: mockMentorUser,
        accessToken: "valid-token-123",
      });

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <div>Auth Form Content</div>
                </GuestRoute>
              }
            />
            <Route path="/mentor" element={<div>Mentor Dashboard Area</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Mentor Dashboard Area")).toBeTruthy();
    });

    it("redirects authenticated admin to /admin", () => {
      useAuthStore.setState({
        hydrated: true,
        user: mockAdminUser,
        accessToken: "valid-token-123",
      });

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <div>Auth Form Content</div>
                </GuestRoute>
              }
            />
            <Route path="/admin" element={<div>Admin Control Area</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Admin Control Area")).toBeTruthy();
    });
  });
});
