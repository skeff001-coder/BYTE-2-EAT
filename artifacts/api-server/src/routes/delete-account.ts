import { Router, type Request, type Response } from "express";

const router = Router();

router.delete("/delete-account", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(503).json({
      error: "Account deletion is not fully configured on this server. Please contact support@byte2eat.app to request account deletion.",
    });
    return;
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!userRes.ok) {
    res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
    return;
  }

  const userData = (await userRes.json()) as { id?: string };
  const userId = userData.id;

  if (!userId) {
    res.status(401).json({ error: "Could not verify user identity." });
    return;
  }

  const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!deleteRes.ok) {
    const errData = (await deleteRes.json().catch(() => ({}))) as { message?: string };
    res.status(500).json({ error: errData.message ?? "Failed to delete account. Please contact support@byte2eat.app." });
    return;
  }

  res.json({ success: true });
});

export default router;
