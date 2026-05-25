import { SearchResult } from '../types/search.types';
import { apiService } from './api.service';

class SearchService {
  async search(q: string): Promise<SearchResult[]> {
    return apiService.get<SearchResult[]>(
      `/query/search?q=${encodeURIComponent(q)}`,
    );
  }
}

export const searchService = new SearchService();
