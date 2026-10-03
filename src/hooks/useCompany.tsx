import { useEffect, useState } from "react";
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
  profiles?: { full_name: string | null; email: string | null } | null;
}

export const useCompany = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCompany = async () => {
    if (!user) {
      setCompany(null);
      setMembers([]);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: memberData, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      setLoading(false);
      throw membershipError;
    }

    if (!memberData) {
      setCompany(null);
      setMembers([]);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(memberData.role === "admin");

    const [companyResult, membersResult] = await Promise.all([
      supabase.from("companies").select("*").eq("id", memberData.company_id).single(),
      supabase.from("company_members").select("id, user_id, role").eq("company_id", memberData.company_id),
    ]);

    if (companyResult.error) throw companyResult.error;
    if (membersResult.error) throw membersResult.error;
    setCompany(companyResult.data);

    const rows = membersResult.data ?? [];
    const userIds = rows.map((member) => member.user_id);
    const { data: profilesData, error: profilesError } = userIds.length
      ? await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;
    setMembers(rows.map((member) => ({
      ...member,
      profiles: profilesData?.find((profile) => profile.user_id === member.user_id) ?? null,
    })));

    setLoading(false);
  };

  const createCompany = async (name: string) => {
    if (!user) return null;
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Company name is required");

    const { data, error } = await supabase
      .from("companies")
      .insert({ name: cleanName, created_by: user.id })
      .select()
      .single();
    if (error) throw error;

    const { error: memberError } = await supabase
      .from("company_members")
      .insert({ company_id: data.id, user_id: user.id, role: "admin" as any });
    if (memberError) {
      await supabase.from("companies").delete().eq("id", data.id);
      throw memberError;
    }

    await fetchCompany();
    return data;
  };

  const inviteMember = async (email: string) => {
    if (!user || !company || !isAdmin) throw new Error("Administrator access required");
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.functions.invoke("send-invitation", {
      body: { email: normalizedEmail, companyId: company.id },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  };

  const removeMember = async (member: CompanyMember) => {
    if (!company || !isAdmin) throw new Error("Administrator access required");
    if (member.user_id === user?.id) throw new Error("You cannot remove your own administrator membership");
    const { error } = await supabase.from("company_members").delete().eq("id", member.id).eq("company_id", company.id);
    if (error) throw error;
    await fetchCompany();
  };

  const deleteCompany = async () => {
    if (!company || !isAdmin) throw new Error("Administrator access required");
    const { error } = await supabase.from("companies").delete().eq("id", company.id);
    if (error) throw error;
    setCompany(null);
    setMembers([]);
    setIsAdmin(false);
  };

  useEffect(() => {
    fetchCompany().catch((error) => {
      console.error("Failed to load company", error);
      setLoading(false);
    });
  }, [user?.id]);

  return {
    company,
    members,
    isAdmin,
    loading,
    createCompany,
    inviteMember,
    removeMember,
    deleteCompany,
    refetch: fetchCompany,
  };
};
