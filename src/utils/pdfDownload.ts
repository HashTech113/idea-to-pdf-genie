import { supabase } from "@/integrations/supabase/client";

export interface UserRoleData {
  role: string;
  name: string | null;
  planExpiry: string | null;
}

/**
 * Fetch user role from profiles table
 */
export const getUserRole = async (userId: string): Promise<UserRoleData | null> => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, name, plan_expiry")
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    return {
      role: profile?.role || "user",
      name: profile?.name || null,
      planExpiry: profile?.plan_expiry || null,
    };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
};

/**
 * Fetch latest PDF URL for a user
 */
export const getLatestPdfUrl = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("user_business")
      .select("pdf_url")
      .eq("user_id", userId)
      .not("pdf_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.pdf_url || null;
  } catch (error) {
    console.error("Error fetching PDF URL:", error);
    return null;
  }
};

/**
 * Trigger automatic PDF download
 */
export const autoDownloadPdf = (pdfUrl: string) => {
  const link = document.createElement("a");
  link.href = pdfUrl;
  link.target = "_blank";
  link.download = "business-plan.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
