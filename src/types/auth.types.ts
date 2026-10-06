export interface UserProfile {
  id: string;
  email: string;
  username: string;
  eloRating: number;
  matchesWon: number;
  matchesLost: number;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}