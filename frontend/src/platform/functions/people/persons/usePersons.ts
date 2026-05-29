import { personService } from '@/platform/functions/people/persons/person.service.ts';
import { Person, PersonCreate, PersonUpdate } from '@/types/person.types.ts';
import { createEntityHooks } from '@/hooks/useEntityCrud.ts';

const { useList, useById, useMutations } = createEntityHooks<
  Person,
  PersonCreate,
  PersonUpdate
>(personService, 'persons');

export function usePersons() {
  const { items: persons, ...rest } = useList();
  return { persons, ...rest };
}

export function usePerson(id: string | null) {
  const { item: person, ...rest } = useById(id);
  return { person, ...rest };
}

export function usePersonMutations() {
  const {
    create: createPerson,
    update: updatePerson,
    remove: deletePerson,
    ...rest
  } = useMutations();
  return { createPerson, updatePerson, deletePerson, ...rest };
}
