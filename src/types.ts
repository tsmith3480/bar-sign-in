export interface Patron {
  name: string;
  contact: string | null;
  assignedNumber: number;
  registeredAt: string;
}

export interface SignIn {
  patronNumber: number;
  signedInAt: string;
  weekNumber: number;
}

export interface Drawing {
  weekNumber: number;
  drawnNumber: number;
  winnerName?: string;
  prizeAmount: number;
  drawnAt: string;
  wasWon: boolean;
}
