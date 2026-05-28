import { redirect } from "next/navigation";

import { getCurrentUserWithPlayer } from "@/lib/auth";

export default async function IndexPage() {
  const currentUser = await getCurrentUserWithPlayer();

  redirect(currentUser?.player ? "/home" : "/login");
}
