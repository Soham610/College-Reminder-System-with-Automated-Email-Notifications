import { request } from "./api";

export const getEmailDiagnostics = () => request("/system/email-diagnostics");
