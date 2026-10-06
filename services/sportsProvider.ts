import type { SportsProviderAdapter, SportsProviderEvent } from "../features/scoring/liveScoringContract";

export type ProviderConfig = {
  name: string;
  apiKey: string;
  baseUrl: string;
};

export function createProviderAdapter(config: ProviderConfig): SportsProviderAdapter {
  return {
    async fetchEvents(matchId: string): Promise<SportsProviderEvent[]> {
      throw new Error(
        `Sports provider adapter "${config.name}" is not configured for match ${matchId}`,
      );
    },
  };
}
