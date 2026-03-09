import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Company {
  id: string;
  name: string;
  created_by: string;
}

interface CompanyMember {
  id: string;
  user_id: string;
  role: string;
  profiles?: { full_name: string | null; email: string | null };
}

export const useCompany = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCompany = async () => {
    if (!user) { setLoading(false); return; }
    
    const { data: memberData } = await supabase
      .from("company_members")
      .select("company_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (memberData) {
      setIsAdmin(memberData.role === "admin");

      // Fetch company and members in parallel
      const [companyResult, membersResult] = await Promise.all([
        supabase.from("companies").select("*").eq("id", memberData.company_id).single(),
        supabase.from("company_members").select("id, user_id, role").eq("company_id", memberData.company_id),
      ]);
      
      if (companyResult.data) setCompany(companyResult.data);

      if (membersResult.data) {
        const userIds = membersResult.data.map(m => m.user_id);
        const { data: profilesData } = userIds.length > 0
          ? await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds)
          : { data: [] };
        
        const membersWithProfiles = membersResult.data.map(m => ({
          ...m,
          profiles: profilesData?.find(p => p.user_id === m.user_id) || null,
        }));
        setMembers(membersWithProfiles as CompanyMember[]);
      }
    }
    setLoading(false);
  };

  const createCompany = async (name: string) => {
    if (!user) return null;
    const { data, error } = await supabase.from("companies").insert({ name, created_by: user.id }).select().single();
    if (error) throw error;
    // Add creator as admin
    await supabase.from("company_members").insert({ company_id: data.id, user_id: user.id, role: "admin" as any });
    await fetchCompany();
    return data;
  };

  const inviteMember = async (email: string) => {
    if (!user || !company) return;
    const { error } = await supabase.from("company_invitations").insert({
      company_id: company.id,
      email,
      invited_by: user.id,
    });
    if (error) throw error;

    // Send invitation email via edge function
    const { error: fnError } = await supabase.functions.invoke("send-invitation", {
      body: {
        email,
        companyName: company.name,
        invitedBy: user.user_metadata?.full_name || user.email,
      },
    });
    if (fnError) console.error("Failed to send invitation email:", fnError);
  };

  useEffect(() => { fetchCompany(); }, [user]);

  return { company, members, isAdmin, loading, createCompany, inviteMember, refetch: fetchCompany };
};
