import { describe, it, expect } from 'vitest';
import { fetchTraders } from '../traders';

describe('Trader Server Actions', () => {
  it('should fetch paginated traders (Page 1)', async () => {
    const result = await fetchTraders({ page: 1, limit: 5 });
    expect(result.data.length).toBe(5);
    expect(result.total).toBeGreaterThan(10); // Based on traders.json having 15 items
  });

  it('should filter traders by company name (Tesla)', async () => {
    const result = await fetchTraders({ search: 'Tesla' });
    expect(result.data.length).toBe(1);
    expect(result.data[0].companyName).toContain('Tesla');
  });

  it('should filter traders by status (Idle)', async () => {
    const result = await fetchTraders({ status: 'Idle' });
    expect(result.data.every(t => t.status === 'Idle')).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('should return empty result for non-existent company', async () => {
    const result = await fetchTraders({ search: 'NonExistentCompanyXYZ' });
    expect(result.data.length).toBe(0);
    expect(result.total).toBe(0);
  });
});
