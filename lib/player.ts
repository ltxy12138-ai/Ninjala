import { redirect } from "next/navigation";

import { getCurrentUserWithPlayer } from "@/lib/auth";

export async function requireCurrentPlayer() {
  const currentUser = await getCurrentUserWithPlayer();

  if (!currentUser?.player) {
    redirect("/login");
  }

  return {
    user: currentUser,
    player: currentUser.player,
  };
}
