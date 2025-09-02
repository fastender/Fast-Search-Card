// src/hooks/useVirtualizedSearch.js
import { useVirtualizer } from '@tanstack/react-virtual';
import { useFuzzySearch } from './useFuzzySearch';

export const useVirtualizedSearch = (items, containerRef) => {
  const { results, ...searchProps } = useFuzzySearch(items);
  
  // Virtualisierung für große Listen
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 80, // Geschätzte Höhe pro Item
    overscan: 5
  });
  
  // Web Worker für schwere Suchen
  const searchWorker = useMemo(() => {
    if (typeof Worker !== 'undefined') {
      return new Worker('/search-worker.js');
    }
    return null;
  }, []);
  
  const searchAsync = useCallback(async (query) => {
    if (!searchWorker) {
      return searchProps.search(query);
    }
    
    return new Promise((resolve) => {
      searchWorker.postMessage({ query, items });
      searchWorker.onmessage = (e) => resolve(e.data);
    });
  }, [searchWorker, items]);
  
  return {
    ...searchProps,
    results,
    virtualizer,
    searchAsync
  };
};