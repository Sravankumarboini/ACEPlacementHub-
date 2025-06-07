import { Client } from '@elastic/elasticsearch';
import type { Job } from '@shared/schema';

// Initialize Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  // For development without authentication
  auth: process.env.ELASTICSEARCH_AUTH ? {
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || ''
  } : undefined
});

const JOBS_INDEX = 'jobs';

export class ElasticsearchService {
  private isElasticsearchAvailable = false;

  constructor() {
    this.initializeElasticsearch();
  }

  private async initializeElasticsearch() {
    try {
      await client.ping();
      this.isElasticsearchAvailable = true;
      console.log('Elasticsearch connected successfully');
      await this.createJobsIndex();
    } catch (error) {
      console.warn('Elasticsearch not available, falling back to PostgreSQL search:', error instanceof Error ? error.message : 'Unknown error');
      this.isElasticsearchAvailable = false;
    }
  }

  private async createJobsIndex() {
    try {
      const exists = await client.indices.exists({ index: JOBS_INDEX });
      if (!exists) {
        await client.indices.create({
          index: JOBS_INDEX,
          mappings: {
            properties: {
              id: { type: 'integer' },
              title: { 
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              company: { 
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              description: { 
                type: 'text',
                analyzer: 'standard'
              },
              location: { 
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              type: { type: 'keyword' },
              experience: { type: 'text' },
              salary: { type: 'text' },
              requirements: { type: 'text' },
              skills: { type: 'text' },
              eligibility: { type: 'text' },
              deadline: { type: 'date' },
              isActive: { type: 'boolean' },
              postedBy: { type: 'integer' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          },
          settings: {
            analysis: {
              analyzer: {
                job_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'snowball']
                }
              }
            }
          }
        });
        console.log('Jobs index created successfully');
      }
    } catch (error) {
      console.error('Error creating jobs index:', error);
    }
  }

  async indexJob(job: Job) {
    if (!this.isElasticsearchAvailable) return;

    try {
      await client.index({
        index: JOBS_INDEX,
        id: job.id.toString(),
        document: job
      });
    } catch (error) {
      console.error('Error indexing job:', error);
    }
  }

  async updateJob(job: Job) {
    if (!this.isElasticsearchAvailable) return;

    try {
      await client.update({
        index: JOBS_INDEX,
        id: job.id.toString(),
        body: {
          doc: job
        }
      });
    } catch (error) {
      console.error('Error updating job in index:', error);
    }
  }

  async deleteJob(jobId: number) {
    if (!this.isElasticsearchAvailable) return;

    try {
      await client.delete({
        index: JOBS_INDEX,
        id: jobId.toString()
      });
    } catch (error) {
      console.error('Error deleting job from index:', error);
    }
  }

  async searchJobs(query: string, filters?: { location?: string; type?: string }): Promise<number[]> {
    if (!this.isElasticsearchAvailable) {
      return [];
    }

    try {
      const must: any[] = [];
      const filter: any[] = [];

      // Add search query with fuzzy matching
      if (query && query.trim()) {
        must.push({
          multi_match: {
            query: query.trim(),
            fields: ['title^3', 'company^2', 'description', 'skills', 'requirements'],
            type: 'best_fields',
            fuzziness: 'AUTO',
            minimum_should_match: '75%'
          }
        });
      }

      // Add filters
      if (filters?.location) {
        filter.push({
          wildcard: {
            'location.keyword': `*${filters.location}*`
          }
        });
      }

      if (filters?.type) {
        filter.push({
          term: {
            type: filters.type
          }
        });
      }

      // Only search active jobs
      filter.push({
        term: {
          isActive: true
        }
      });

      const searchBody: any = {
        query: {
          bool: {}
        },
        sort: [
          { createdAt: { order: 'desc' } }
        ],
        size: 100
      };

      if (must.length > 0) {
        searchBody.query.bool.must = must;
      }

      if (filter.length > 0) {
        searchBody.query.bool.filter = filter;
      }

      // If no search query, match all active jobs
      if (must.length === 0 && filter.length > 0) {
        searchBody.query.bool.must = [{ match_all: {} }];
      }

      const response = await client.search({
        index: JOBS_INDEX,
        body: searchBody
      });

      return response.body.hits.hits.map((hit: any) => parseInt(hit._id));
    } catch (error) {
      console.error('Error searching jobs:', error);
      return [];
    }
  }

  async bulkIndexJobs(jobs: Job[]) {
    if (!this.isElasticsearchAvailable || jobs.length === 0) return;

    try {
      const body = jobs.flatMap(job => [
        { index: { _index: JOBS_INDEX, _id: job.id.toString() } },
        job
      ]);

      await client.bulk({ body });
      console.log(`Bulk indexed ${jobs.length} jobs`);
    } catch (error) {
      console.error('Error bulk indexing jobs:', error);
    }
  }

  isAvailable(): boolean {
    return this.isElasticsearchAvailable;
  }
}

export const elasticsearchService = new ElasticsearchService();