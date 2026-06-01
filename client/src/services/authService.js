import { request } from "./api";

export const signupStudent = (payload) =>
  request("/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const loginStudent = (payload) =>
  request("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const loginAdmin = (payload) =>
  request("/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const resetStudentPassword = (payload) =>
  request("/reset-password", {
    method: "POST",
    body: JSON.stringify({ ...payload, role: "student" }),
  });

export const resetAdminPassword = (payload) =>
  request("/admin/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
