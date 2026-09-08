export interface ErrorFixItem {
  id: string;
  category: 'security' | 'stability' | 'performance' | 'standards';
  title: string;
  originalBug: string;
  resolvedWith: string;
  impact: string;
}

export interface SimulationResult {
  rawUrl: string;
  decodedPath: string;
  normalizedPath: string;
  isTraversal: boolean;
  resolvedTarget: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  message: string;
}
