import { SearchResult } from './search.types';
import { apiService } from '@/services/api.service';

class SearchService {
  async search(q: string): Promise<SearchResult[]> {
    return apiService.get<SearchResult[]>(
      `/query/search?q=${encodeURIComponent(q)}`,
    );
  }
}

export const searchService = new SearchService();
