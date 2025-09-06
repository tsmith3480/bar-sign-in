import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Patron, CreatePatronData } from "../types/database";

export const usePatrons = () => {
  const searchPatrons = useCallback(
    async (query: string): Promise<Patron[]> => {
      if (!query.trim()) return [];

      const isNumber = !isNaN(Number(query));

      const { data: patrons, error } = await supabase
        .from("patrons")
        .select("*")
        .or(isNumber ? `assigned_number.eq.${query}` : `name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return patrons || [];
    },
    []
  );

  const getPatronById = useCallback(
    async (id: string): Promise<Patron | null> => {
      const { data: patron, error } = await supabase
        .from("patrons")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return patron;
    },
    []
  );

  const getPatronByNumber = useCallback(
    async (assignedNumber: number): Promise<Patron | null> => {
      const { data: patron, error } = await supabase
        .from("patrons")
        .select("*")
        .eq("assigned_number", assignedNumber)
        .single();

      if (error) throw error;
      return patron;
    },
    []
  );

  const getAllPatrons = useCallback(async (): Promise<Patron[]> => {
    const { data: patrons, error } = await supabase
      .from("patrons")
      .select("id, assigned_number, name");

    if (error) throw error;
    return patrons || [];
  }, []);

  const createPatron = useCallback(
    async (patronData: CreatePatronData): Promise<Patron> => {
      // Get the highest assigned number
      const { data: existingPatrons, error: fetchError } = await supabase
        .from("patrons")
        .select("assigned_number")
        .order("assigned_number", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      // Calculate new number (start from 1 or increment highest)
      const newNumber =
        existingPatrons && existingPatrons[0]
          ? existingPatrons[0].assigned_number + 1
          : 1;

      // Insert new patron
      const { data: newPatron, error: insertError } = await supabase
        .from("patrons")
        .insert({
          name: patronData.name,
          contact: patronData.contact || null,
          assigned_number: newNumber,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return newPatron;
    },
    []
  );

  return {
    searchPatrons,
    getPatronById,
    getPatronByNumber,
    getAllPatrons,
    createPatron,
  };
};
