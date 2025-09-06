import { useCallback } from "react";

const MILLISECONDS_PER_DAY = 86400000;

export const useWeekUtils = () => {
  const getCurrentWeek = useCallback(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / MILLISECONDS_PER_DAY +
        startOfYear.getDay() +
        1) /
        7
    );
  }, []);

  return { getCurrentWeek };
};
