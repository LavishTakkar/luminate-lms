import axios, { type AxiosError } from "axios";
import type { ApiResponse } from "@lms/shared";

const TOKEN_KEY = "lms:token";

/**
 * In dev, Vite's proxy forwards /api → http://localhost:5000.
 * In production, VITE_API_URL points at the deployed Render API.
 */
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isApiError(err: unknown): err is AxiosError<ApiResponse<unknown>> {
  return axios.isAxiosError(err);
}

export function apiErrorMessage(err: unknown): string {
  if (!isApiError(err)) return "Unexpected error";
  const body = err.response?.data;
  if (body && "error" in body && body.error) return body.error.message;
  return err.message || "Network error";
}

/** Unwraps the `{ success, data }` envelope from any GET/POST. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await api.get<ApiResponse<T>>(path);
  if (!res.data.success) throw new Error(res.data.error.message);
  return res.data.data;
}

export async function apiPost<T, B = unknown>(path: string, body?: B): Promise<T> {
  const res = await api.post<ApiResponse<T>>(path, body);
  if (!res.data.success) throw new Error(res.data.error.message);
  return res.data.data;
}
