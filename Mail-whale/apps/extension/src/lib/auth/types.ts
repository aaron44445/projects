export interface AuthState {
  provider: "gmail" | "outlook";
  accessToken: string;
  email: string;
  expiresAt: number;
}
