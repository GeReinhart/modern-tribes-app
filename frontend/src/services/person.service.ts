import { apiService } from './api.service';
import { Person, PersonCreate, PersonUpdate } from '../types/person.types';

class PersonService {
    private endpoint = '/crud/persons';

    async getAll(): Promise<Person[]> {
        return apiService.get<Person[]>(this.endpoint);
    }

    async getById(id: string): Promise<Person> {
        return apiService.get<Person>(`${this.endpoint}/${id}`);
    }


    async create(data: PersonCreate): Promise<Person> {
        return apiService.post<Person>(this.endpoint, data);
    }

    async update(id: string, data: PersonUpdate): Promise<Person> {
        return apiService.put<Person>(`${this.endpoint}/${id}`, data);
    }

    async delete(id: string): Promise<void> {
        return apiService.delete<void>(`${this.endpoint}/${id}`);
    }
}

export const personService = new PersonService();