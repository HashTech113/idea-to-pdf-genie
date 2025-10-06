import { supabase } from "@/integrations/supabase/client";

export async function startPdfJob(reportId: string, formData: any) {
  // functions.invoke automatically includes Authorization and apikey
  const { data, error } = await supabase.functions.invoke("generate-business-plan", {
    body: { reportId, formData },
  });
  
  if (error) {
    // Surface readable error to UI
    throw new Error(error.message || JSON.stringify(error));
  }
  
  return data; // { ok:true, started:true, ... }
}
