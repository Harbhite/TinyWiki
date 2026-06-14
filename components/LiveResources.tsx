import React, { useState, useEffect } from 'react';
import { LiveResource } from '../types';

interface LiveResourcesProps {
  resources: LiveResource[];
}

/**
 * Feature 6: Real-Time Web Augmentation (Live Citations)
 * Pulls in the latest news, research papers, and trending videos related to the wiki topic.
 * Ensures the wiki remains a living document connected to the current world.
 */
export const LiveResources: React.FC<LiveResourcesProps> = ({ resources }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [filteredResources, setFilteredResources] = useState<LiveResource[]>(resources);

  useEffect(() => {
    if (selectedFilter === 'All') {
      setFilteredResources(resources);
    } else {
      setFilteredResources(resources.filter((r) => r.source === selectedFilter));
    }
  }, [selectedFilter, resources]);

  if (!resources || resources.length === 0) {
    return null;
  }

  const sources = ['All', ...new Set(resources.map((r) => r.source))];

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-terracotta/10 to-transparent p-6 border-b border-gray-100">
        <h3 className="font-bold text-earth-brown mb-1">Live Updates</h3>
        <p className="text-xs text-earth-brown/50 font-light">
          Latest news, research, and resources related to this topic
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex gap-2 overflow-x-auto">
        {sources.map((source) => (
          <button
            key={source}
            onClick={() => setSelectedFilter(source)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedFilter === source
                ? 'bg-terracotta text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {source}
          </button>
        ))}
      </div>

      {/* Resources List */}
      <div className="divide-y divide-gray-100">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource, idx) => (
            <a
              key={idx}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-terracotta uppercase">
                      {resource.source}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(resource.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-earth-brown group-hover:text-terracotta transition-colors mb-1 truncate">
                    {resource.title}
                  </h4>
                  <p className="text-sm text-earth-brown/60 font-light line-clamp-2">
                    {resource.summary}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-terracotta transition-colors shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </a>
          ))
        ) : (
          <div className="p-6 text-center">
            <p className="text-sm text-earth-brown/50 font-light">
              No resources found for this filter.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-earth-brown/50 text-center font-light">
          💡 Resources are updated daily. Click any resource to read the full article.
        </p>
      </div>
    </div>
  );
};
