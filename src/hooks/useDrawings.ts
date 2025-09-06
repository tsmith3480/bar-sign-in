import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Drawing, DrawingResult } from "../types/database";

export const useDrawings = () => {
  const getDrawingByWeek = useCallback(
    async (weekNumber: number): Promise<Drawing | null> => {
      const { data: drawing, error } = await supabase
        .from("drawings")
        .select("*")
        .eq("week_number", weekNumber)
        .maybeSingle();

      if (error) throw error;
      return drawing;
    },
    []
  );

  const getLatestDrawing = useCallback(async (): Promise<{
    prize_amount: number;
    winner_id?: string;
  } | null> => {
    const { data: drawing, error } = await supabase
      .from("drawings")
      .select("prize_amount, winner_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return drawing;
  }, []);

  const performDrawing = useCallback(
    async (
      weekNumber: number,
      prizeAmount: number,
      allPatrons: { id: string; name: string; assigned_number: number }[],
      signedInPatronIds: Set<string>
    ): Promise<DrawingResult> => {
      if (!allPatrons?.length) {
        throw new Error("No patrons found in database");
      }

      // Randomly select one patron from all patrons
      const selectedPatron =
        allPatrons[Math.floor(Math.random() * allPatrons.length)];

      // Check if the selected patron signed in this week
      const isWinner = signedInPatronIds.has(selectedPatron.id);
      const noSignIns = signedInPatronIds.size === 0;

      // Record the drawing result
      const { error: drawingError } = await supabase.from("drawings").insert({
        week_number: weekNumber,
        drawn_number: selectedPatron.assigned_number,
        winner_id: isWinner ? selectedPatron.id : null,
        prize_amount: prizeAmount,
      });

      if (drawingError) throw drawingError;

      return {
        selectedPatron,
        isWinner,
        noSignIns,
        prizeAmount,
      };
    },
    []
  );

  const deleteDrawing = useCallback(
    async (weekNumber: number): Promise<void> => {
      // First verify the drawing exists
      const { data: drawingToDelete, error: findError } = await supabase
        .from("drawings")
        .select("*")
        .eq("week_number", weekNumber)
        .maybeSingle();

      if (findError) throw findError;

      if (!drawingToDelete) {
        throw new Error("No drawing found for this week");
      }

      // Delete the drawing
      const { error: deleteError } = await supabase
        .from("drawings")
        .delete()
        .eq("id", drawingToDelete.id);

      if (deleteError) throw deleteError;
    },
    []
  );

  return {
    getDrawingByWeek,
    getLatestDrawing,
    performDrawing,
    deleteDrawing,
  };
};
