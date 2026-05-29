import { SearchResult } from './search.types.ts';
import { apiService } from '@/platform/core/api/api.service.ts';

class SearchService {
  async search(q: string): Promise<SearchResult[]> {
    return apiService.get<SearchResult[]>(
      `/query/search?q=${encodeURIComponent(q)}`,
    );
  }
}

export const searchService = new SearchService();
