import type { BraveSearch } from 'brave-search';
import type { BraveMcpServer } from '../server.js';
import { SafeSearchLevel } from 'brave-search/dist/types.js';
import { z } from 'zod';
import { BaseTool } from './BaseTool.js';

const webSearchInputSchema = z.object({
  query: z.string().describe('The term to search the internet for'),
  count: z.number().min(1).max(20).default(10).optional().describe('The number of results to return, minimum 1, maximum 20'),
  offset: z.number().min(0).default(0).optional().describe('The offset for pagination, minimum 0'),
});

export class BraveWebSearchTool extends BaseTool<typeof webSearchInputSchema, any> {
  public readonly name = 'brave_web_search';
  public readonly description = 'Performs a web search using the Brave Search API, ideal for general queries, and online content. '
    + 'Use this for broad information gathering, recent events, or when you need diverse web sources. '
    + 'Maximum 20 results per request ';

  public readonly inputSchema = webSearchInputSchema;

  constructor(private braveMcpServer: BraveMcpServer, private braveSearch: BraveSearch) {
    super();
  }

  public async executeCore(input: z.infer<typeof webSearchInputSchema>) {
    const { query, count, offset } = input;
    const results = await this.braveSearch.webSearch(query, {
      count,
      offset,
      safesearch: SafeSearchLevel.Off,
    });
    if (!results.web || results.web?.results.length === 0) {
      this.braveMcpServer.log(`No results found for "${query}"`);
      const text = `No results found for "${query}"`;
      return { content: [{ type: 'text' as const, text }] };
    }
    const text = results.web.results.map(result => `Title: ${result.title}\nURL: ${result.url}\nDescription: ${result.description}`).join('\n\n');
    return { content: [{ type: 'text' as const, text }] };
  }
}
