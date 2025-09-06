import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { SignIn, Patron } from "../types/database";

const NO_ROWS_ERROR_CODE = "PGRST116"; // PGRST116 is "no rows returned"

export const useSignIns = () => {
  const checkSignInStatus = useCallback(
    async (patronId: string, weekNumber: number): Promise<boolean> => {
      const { data: existingSignIn, error } = await supabase
        .from("sign_ins")
        .select("id")
        .eq("patron_id", patronId)
        .eq("week_number", weekNumber)
        .single();

      if (error && error.code !== NO_ROWS_ERROR_CODE) throw error;
      return !!existingSignIn;
    },
    []
  );

  const checkMultipleSignInStatus = useCallback(
    async (patronIds: string[], weekNumber: number): Promise<Set<string>> => {
      const { data: signIns, error } = await supabase
        .from("sign_ins")
        .select("patron_id")
        .in("patron_id", patronIds)
        .eq("week_number", weekNumber);

      if (error) throw error;
      return new Set(signIns?.map((s) => s.patron_id) || []);
    },
    []
  );

  const createSignIn = useCallback(
    async (patronId: string, weekNumber: number): Promise<SignIn> => {
      const { data: signIn, error } = await supabase
        .from("sign_ins")
        .insert({
          patron_id: patronId,
          week_number: weekNumber,
        })
        .select()
        .single();

      if (error) throw error;
      return signIn;
    },
    []
  );

  const getWeekSignIns = useCallback(
    async (weekNumber: number): Promise<SignIn[]> => {
      const { data: signIns, error } = await supabase
        .from("sign_ins")
        .select("*")
        .eq("week_number", weekNumber);

      if (error) throw error;
      return signIns || [];
    },
    []
  );

  const getWeekSignInIds = useCallback(
    async (weekNumber: number): Promise<string[]> => {
      const { data: signIns, error } = await supabase
        .from("sign_ins")
        .select("patron_id")
        .eq("week_number", weekNumber);

      if (error) throw error;
      return signIns?.map((s) => s.patron_id) || [];
    },
    []
  );

  const enrichPatronsWithSignInStatus = useCallback(
    async (patrons: Patron[], weekNumber: number): Promise<Patron[]> => {
      if (patrons.length === 0) return patrons;

      const patronIds = patrons.map((p) => p.id);
      const signedInPatronIds = await checkMultipleSignInStatus(
        patronIds,
        weekNumber
      );

      return patrons.map((patron) => ({
        ...patron,
        isAlreadySignedIn: signedInPatronIds.has(patron.id),
      }));
    },
    [checkMultipleSignInStatus]
  );

  return {
    checkSignInStatus,
    checkMultipleSignInStatus,
    createSignIn,
    getWeekSignIns,
    getWeekSignInIds,
    enrichPatronsWithSignInStatus,
  };
};
