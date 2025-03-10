import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth/login");
  // The return null is not necessary with Next.js redirect,
  // but keeping it doesn't hurt as the code after redirect won't execute
  return null;
}