import { Query } from '../Query';

/**
 * Query to retrieve all streaming platforms for filtering
 */
export interface GetStreamingPlatformsQuery extends Query<GetStreamingPlatformsResult> {
  // No filters needed - return all platforms
}

export interface StreamingPlatformDto {
  id: string;
  name: string;
}

export interface GetStreamingPlatformsResult {
  platforms: StreamingPlatformDto[];
}
