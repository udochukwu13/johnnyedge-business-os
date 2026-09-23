import { createClient } from "@/lib/supabase/server";

type Business = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  country: string | null;
  currency: string | null;
  phone: string | null;
  email: string | null;
};

export async function getActiveBusiness() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: memberships, error } = await supabase
    .from("business_members")
    .select(`
      role,
      business:businesses (
        id,
        name,
        slug,
        industry,
        country,
        currency,
        phone,
        email
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !memberships?.length) {
    return null;
  }

  const first = memberships[0];

  const business = Array.isArray(first.business)
    ? first.business[0]
    : first.business;

  if (!business) {
    return null;
  }

  return {
    business: business as Business,
    role: first.role,
  };
}