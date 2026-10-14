export interface DocumentChunk {
  id: string;
  fileName: string;
  content: string;
  pageNumber?: number;
}

// Simple text chunker (splits long text into chunks of ~500 characters with overlap)
export function chunkText(text: string, fileName: string, chunkSize = 500, overlap = 50): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let index = 0;
  let chunkId = 0;

  while (index < text.length) {
    const slice = text.slice(index, index + chunkSize);
    chunks.push({
      id: `${fileName}-chunk-${chunkId++}`,
      fileName,
      content: slice,
    });
    index += chunkSize - overlap;
  }

  return chunks;
}

// Retrieve relevant chunks based on query word matching (client-side retrieval)
export function retrieveRelevantChunks(query: string, allChunks: DocumentChunk[], topK = 3): DocumentChunk[] {
  if (!allChunks.length) return [];

  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (!queryTerms.length) return allChunks.slice(0, topK);

  // Score chunks based on term frequency matches
  const scored = allChunks.map(chunk => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        score += 1;
      }
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return top matching chunks, or fallback to first few if no strong match
  const topMatches = scored.filter(s => s.score > 0).map(s => s.chunk);
  return topMatches.length > 0 ? topMatches.slice(0, topK) : allChunks.slice(0, topK);
}