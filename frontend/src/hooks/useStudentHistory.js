import { useQuery } from '@tanstack/react-query';
import { fetchStudentHistory } from '../api';

export function useStudentHistory(searchParams) {
  return useQuery({
    queryKey: ['studentHistory', searchParams],
    queryFn: () => fetchStudentHistory(searchParams),
    enabled: !!(searchParams?.contactId || searchParams?.name),
    staleTime: 30_000,
  });
}
