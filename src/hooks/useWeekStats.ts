import { useCallback } from "react";
import type { WeekStats } from "../types/database";
import { useWeekUtils } from "./useWeekUtils";
import { useDrawings } from "./useDrawings";
import { useSignIns } from "./useSignIns";
import { usePatrons } from "./usePatrons";

export const useWeekStats = () => {
  const { getCurrentWeek } = useWeekUtils();
  const { getDrawingByWeek, getLatestDrawing } = useDrawings();
  const { getWeekSignIns } = useSignIns();
  const { getPatronByNumber } = usePatrons();

  const fetchWeekStats = useCallback(async (): Promise<WeekStats> => {
    const weekNumber = getCurrentWeek();

    // Check if there's already been a drawing this week
    const thisWeekDrawing = await getDrawingByWeek(weekNumber);

    // If there's a drawing, get the patron's name
    let drawnPatronName = "Unknown";
    if (thisWeekDrawing) {
      const patronData = await getPatronByNumber(thisWeekDrawing.drawn_number);
      if (patronData) {
        drawnPatronName = patronData.name;
      }
    }

    // If there's been a drawing this week, use next week's number
    const effectiveWeek = thisWeekDrawing ? weekNumber + 1 : weekNumber;

    // Get sign-in count for the effective week
    const signIns = await getWeekSignIns(effectiveWeek);

    // Get current prize amount
    const lastDrawing = await getLatestDrawing();

    // Each sign-in contributes $1 to the pot
    const currentWeekAmount = signIns?.length || 0;

    // If last drawing had a winner, don't add previous amount
    const previousUnclaimed =
      lastDrawing && !lastDrawing.winner_id ? lastDrawing.prize_amount : 0;

    return {
      weekNumber,
      effectiveWeek,
      signInCount: signIns?.length || 0,
      prizeAmount: currentWeekAmount + previousUnclaimed,
      isDrawingDone: !!thisWeekDrawing,
      ...(thisWeekDrawing && {
        latestDrawing: {
          drawnNumber: thisWeekDrawing.drawn_number,
          drawnName: drawnPatronName,
          wasWinner: !!thisWeekDrawing.winner_id,
        },
      }),
    };
  }, [
    getCurrentWeek,
    getDrawingByWeek,
    getLatestDrawing,
    getWeekSignIns,
    getPatronByNumber,
  ]);

  return {
    fetchWeekStats,
    getCurrentWeek,
  };
};
