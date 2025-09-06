export interface Patron {
  id: string;
  name: string;
  assigned_number: number;
  contact?: string;
  isAlreadySignedIn?: boolean;
}

export interface CreatePatronData {
  name: string;
  contact?: string;
}

export interface SignIn {
  id: string;
  patron_id: string;
  week_number: number;
  created_at: string;
}

export interface Drawing {
  id: string;
  week_number: number;
  drawn_number: number;
  winner_id?: string;
  prize_amount: number;
  drawn_at: string;
  created_at: string;
}

export interface WeekStats {
  weekNumber: number;
  signInCount: number;
  prizeAmount: number;
  isDrawingDone: boolean;
  effectiveWeek: number;
  latestDrawing?: {
    drawnNumber: number;
    drawnName: string;
    wasWinner: boolean;
  };
}

export interface DrawingResult {
  selectedPatron: {
    id: string;
    name: string;
    assigned_number: number;
  };
  isWinner: boolean;
  noSignIns: boolean;
  prizeAmount: number;
}
