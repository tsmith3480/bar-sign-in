import { useCallback } from "react";

export const useWeekUtils = () => {
  const getCurrentWeek = useCallback(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 +
        startOfYear.getDay() +
        1) /
        7
    );
  }, []);

  return { getCurrentWeek };
};
