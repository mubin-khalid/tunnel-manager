/** Persisted app preferences (subset of the Rust `AppSettings` struct). */
export interface AppSettings {
  auto_start: boolean;
  authtoken?: string | null;
}
