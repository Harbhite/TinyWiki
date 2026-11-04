import React, { useEffect, useRef, useState } from 'react';
import { ConceptNode, ConceptEdge } from '../types';
import { useDarkMode } from '../contexts/DarkModeContext';

interface ConceptMapProps {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  onNodeClick: (nodeId: string) => void;
  onClose: () => void;
}

/**
 * Feature 2: Dynamic Concept Mapping (Interactive Graph)
 * Generates a 2D interactive knowledge graph showing how concepts relate to each other.
 * Users can click nodes to navigate to relevant sections.
 */
export const ConceptMap: React.FC<ConceptMapProps> = ({
  nodes,
  edges,
  onNodeClick,
  onClose,
}) => {
  const { isDark } = useDarkMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );

  // Simple force-directed layout algorithm
  useEffect(() => {
    if (!nodes.length) return;

    const newPositions = new Map<string, { x: number; y: number }>();
    const width = 800;
    const height = 600;

    // Initialize positions randomly
    nodes.forEach((node) => {
      newPositions.set(node.id, {
        x: Math.random() * width,
        y: Math.random() * height,
      });
    });

    // Run a few iterations of force simulation
    for (let iteration = 0; iteration < 50; iteration++) {
      const forces = new Map<string, { fx: number; fy: number }>();

      nodes.forEach((node) => {
        forces.set(node.id, { fx: 0, fy: 0 });
      });

      // Repulsive forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const pos1 = newPositions.get(nodes[i].id)!;
          const pos2 = newPositions.get(nodes[j].id)!;
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 50 / (dist * dist);

          const f1 = forces.get(nodes[i].id)!;
          const f2 = forces.get(nodes[j].id)!;
          f1.fx -= (force * dx) / dist;
          f1.fy -= (force * dy) / dist;
          f2.fx += (force * dx) / dist;
          f2.fy += (force * dy) / dist;
        }
      }

      // Attractive forces along edges
      edges.forEach((edge) => {
        const pos1 = newPositions.get(edge.source);
        const pos2 = newPositions.get(edge.target);
        if (pos1 && pos2) {
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) / 100;

          const f1 = forces.get(edge.source)!;
          const f2 = forces.get(edge.target)!;
          f1.fx += (force * dx) / dist;
          f1.fy += (force * dy) / dist;
          f2.fx -= (force * dx) / dist;
          f2.fy -= (force * dy) / dist;
        }
      });

      // Apply forces with damping
      nodes.forEach((node) => {
        const pos = newPositions.get(node.id)!;
        const force = forces.get(node.id)!;
        pos.x += force.fx * 0.1;
        pos.y += force.fy * 0.1;
        pos.x = Math.max(20, Math.min(width - 20, pos.x));
        pos.y = Math.max(20, Math.min(height - 20, pos.y));
      });
    }

    setPositions(newPositions);
  }, [nodes, edges]);

  // Draw the graph on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || positions.size === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = isDark ? '#221a12' : '#FAFAFA';
    ctx.fillRect(0, 0, width, height);

    // Draw edges
    ctx.strokeStyle = isDark ? '#59483e' : '#E5E0D8';
    ctx.lineWidth = 2;
    edges.forEach((edge) => {
      const from = positions.get(edge.source);
      const to = positions.get(edge.target);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Draw edge label
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        ctx.fillStyle = '#C0614B';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(edge.relation, midX, midY - 5);
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const pos = positions.get(node.id)!;
      const isSelected = selectedNode === node.id;

      // Node circle
      ctx.fillStyle = isSelected ? '#C0614B' : (isDark ? '#342820' : '#FFFFFF');
      ctx.strokeStyle = isSelected ? '#C0614B' : (isDark ? '#59483e' : '#E5E0D8');
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 25 : 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Node label
      ctx.fillStyle = isSelected ? '#FFFFFF' : (isDark ? '#E8DDD5' : '#272320');
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label;
      ctx.fillText(label, pos.x, pos.y);
    });
  }, [nodes, edges, positions, selectedNode, isDark]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if a node was clicked
    for (const node of nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < 25) {
        setSelectedNode(node.id);
        onNodeClick(node.id);
        return;
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-earth-brown/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full p-8 flex flex-col items-center gap-6">
        <div className="w-full flex items-center justify-between">
          <h2 className="font-serif text-2xl text-earth-brown">Concept Map</h2>
          <button
            onClick={onClose}
            className="text-earth-brown/40 hover:text-terracotta transition-colors"
            aria-label="Close concept map"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          className="border border-gray-200 rounded-xl cursor-pointer bg-[#FAFAFA]"
        />

        <p className="text-sm text-earth-brown/60 text-center font-light">
          Click on any concept node to navigate to that section. Nodes are positioned based on their relationships.
        </p>
      </div>
    </div>
  );
};
