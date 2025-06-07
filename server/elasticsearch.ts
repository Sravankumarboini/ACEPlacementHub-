import type { Job } from '@shared/schema';

// Enhanced search service that uses PostgreSQL's full-text search capabilities
export class SearchService {
  
  // Fuzzy search function with typo tolerance
  generateSearchVariations(query: string): string[] {
    const variations = [query.toLowerCase()];
    
    // Add common typo patterns
    const words = query.toLowerCase().split(' ');
    words.forEach(word => {
      if (word.length > 3) {
        // Add variations with one character removed
        for (let i = 0; i < word.length; i++) {
          variations.push(word.slice(0, i) + word.slice(i + 1));
        }
        // Add variations with one character substituted
        const common_subs = { 'a': 'e', 'e': 'a', 'i': 'y', 'y': 'i', 'o': 'u', 'u': 'o' };
        for (let i = 0; i < word.length; i++) {
          const char = word[i];
          if (common_subs[char as keyof typeof common_subs]) {
            const newWord = word.slice(0, i) + common_subs[char as keyof typeof common_subs] + word.slice(i + 1);
            variations.push(newWord);
          }
        }
      }
    });
    
    const uniqueVariations: string[] = [];
    const seen = new Set<string>();
    for (const variation of variations) {
      if (!seen.has(variation)) {
        uniqueVariations.push(variation);
        seen.add(variation);
      }
    }
    return uniqueVariations;
  }

  // Generate SQL ILIKE patterns for fuzzy search
  generateSearchPatterns(query: string): string[] {
    const variations = this.generateSearchVariations(query);
    return variations.map(v => `%${v}%`);
  }

  // Calculate search relevance score
  calculateRelevance(job: Job, query: string): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(' ').filter(w => w.length > 2);
    
    words.forEach(word => {
      // Title matches get highest score
      if (job.title.toLowerCase().includes(word)) score += 10;
      // Company matches get medium score
      if (job.company.toLowerCase().includes(word)) score += 7;
      // Description matches get lower score
      if (job.description.toLowerCase().includes(word)) score += 3;
      // Skills/requirements matches get medium score
      if (job.skills?.some(skill => skill.toLowerCase().includes(word))) score += 5;
      if (job.requirements?.some(req => req.toLowerCase().includes(word))) score += 5;
    });
    
    return score;
  }

  // Check if location matches (case-insensitive, partial match)
  locationMatches(jobLocation: string, filterLocation: string): boolean {
    if (!filterLocation || filterLocation === 'All Locations') return true;
    return jobLocation.toLowerCase().includes(filterLocation.toLowerCase());
  }

  // Check if type matches exactly
  typeMatches(jobType: string, filterType: string): boolean {
    if (!filterType || filterType === 'all') return true;
    return jobType === filterType;
  }

  isAvailable(): boolean {
    return true; // Always available since it uses PostgreSQL
  }
}

export const searchService = new SearchService();