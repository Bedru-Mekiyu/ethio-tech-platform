import { api } from "./api";

export async function submitContact(payload: { name: string; email: string; message: string }) {
  await api.post("/contact", payload);
}
