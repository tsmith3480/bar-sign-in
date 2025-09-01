export interface Patron {
  id: string;
  name: string;
  contact?: string;
  assigned_number: number;
  created_at: string;
}

export interface SignIn {
  id: string;
  patron_id: string;
  week_number: number;
  signed_in_at: string;
}

export interface Drawing {
  id: string;
  week_number: number;
  drawn_number: number;
  winner_id?: string;
  prize_amount: number;
  drawn_at: string;
}
