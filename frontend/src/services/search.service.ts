import { apiService } from './api.service';
import { SearchResult } from '../types/search.types';

class SearchService {
    async search(q: string): Promise<SearchResult[]> {
        return apiService.get<SearchResult[]>(`/query/search?q=${encodeURIComponent(q)}`);
    }
}

export const searchService = new SearchService();
