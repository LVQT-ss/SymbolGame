/**
 * Battle utility functions for filtering and managing battle data
 */

export interface BattleSession {
  id: number;
  battle_code: string;
  number_of_rounds: number;
  time_limit: number;
  is_public: boolean;
  creator: {
    id: number;
    username: string;
    full_name: string;
    avatar: string;
    current_level: number;
  };
  opponent?: {
    id: number;
    username: string;
    full_name: string;
    avatar: string;
    current_level: number;
  };
  can_join: boolean;
  is_active: boolean;
  completed?: boolean;
  created_at: string;
  time_since_created: number;
  progress?: {
    total_rounds: number;
    completed_rounds: number;
    progress_percentage: number;
  };
}

/**
 * Filter out stale battles based on creation time and individual time limits
 * This prevents abandoned battles from showing up in the frontend indefinitely
 * 
 * @param battles - Array of battle sessions
 * @param cutoffHours - Hours after which battles are considered stale (default: 6)
 * @param useIndividualTimeLimit - Whether to use each battle's time_limit for filtering (default: true)
 * @returns Filtered array of active battles
 */
export function filterActiveBattles(
  battles: BattleSession[], 
  cutoffHours: number = 6, 
  useIndividualTimeLimit: boolean = true
): BattleSession[] {
  const now = Date.now();
  const globalCutoffTime = now - (cutoffHours * 60 * 60 * 1000);
  
  return battles.filter(battle => {
    // Always show completed battles regardless of age
    if (!battle.can_join && battle.is_active === false) {
      return true;
    }
    
    const createdTime = new Date(battle.created_at).getTime();
    
    // Check individual battle time limit first (if enabled)
    if (useIndividualTimeLimit && battle.time_limit) {
      const battleTimeoutMs = battle.time_limit * 1000; // Convert seconds to milliseconds
      const battleExpired = (now - createdTime) > battleTimeoutMs;
      
      if (battleExpired) {
        console.log(
          `🧹 Filtering out expired battle: ${battle.battle_code} (${battle.time_limit}s timeout exceeded)`
        );
        return false;
      }
    }
    
    // Also check global cutoff time as a fallback
    const isRecentByGlobalCutoff = createdTime > globalCutoffTime;
    
    if (!isRecentByGlobalCutoff) {
      console.log(
        `🧹 Filtering out stale battle: ${battle.battle_code} (${cutoffHours}h+ old)`
      );
      return false;
    }
    
    return true;
  });
}

/**
 * Check if a battle is considered abandoned (old and no opponent)
 * 
 * @param battle - Battle session to check
 * @param cutoffHours - Hours after which battles are considered abandoned (default: 24)
 * @returns True if battle is abandoned
 */
export function isBattleAbandoned(battle: BattleSession, cutoffHours: number = 24): boolean {
  const cutoffTime = Date.now() - (cutoffHours * 60 * 60 * 1000);
  const createdTime = new Date(battle.created_at).getTime();
  
  return (
    !battle.completed &&
    !battle.opponent &&
    createdTime < cutoffTime
  );
}

/**
 * Format time since battle creation for display
 * 
 * @param seconds - Time since creation in seconds
 * @returns Formatted time string
 */
export function formatTimeAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Get difficulty information based on number of rounds
 * 
 * @param rounds - Number of rounds in the battle
 * @returns Object with difficulty text and color
 */
export function getBattleDifficulty(rounds: number): { text: string; color: string } {
  if (rounds <= 5) return { text: "Easy", color: "#4CAF50" };
  if (rounds <= 10) return { text: "Medium", color: "#FF9800" };
  if (rounds <= 15) return { text: "Hard", color: "#F44336" };
  return { text: "Expert", color: "#9C27B0" };
} 