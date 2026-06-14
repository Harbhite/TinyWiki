import React, { useEffect, useRef } from 'react';
import { WikiData, InfographicData } from '../types';

interface InfographicsProps {
  wiki: WikiData;
  infographicData?: InfographicData;
}

/**
 * Feature 11: Automated Infographic Generation
 * Generates visual infographics (timeline, hierarchy, process) from the wiki's structured data.
 * Caters to visual learners who struggle with long-form text.
 */
export const Infographics: React.FC<InfographicsProps> = ({ wiki, infographicData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !infographicData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, width, height);

    if (infographicData.type === 'timeline') {
      drawTimeline(ctx, width, height, infographicData.elements);
    } else if (infographicData.type === 'hierarchy') {
      drawHierarchy(ctx, width, height, infographicData.elements);
    } else if (infographicData.type === 'process') {
      drawProcess(ctx, width, height, infographicData.elements);
    }
  }, [infographicData]);

  const drawTimeline = (ctx: CanvasRenderingContext2D, width: number, height: number, elements: any[]) => {
    const centerY = height / 2;
    const spacing = width / (elements.length + 1);

    // Draw timeline line
    ctx.strokeStyle = '#C0614B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(spacing, centerY);
    ctx.lineTo(width - spacing, centerY);
    ctx.stroke();

    // Draw events
    elements.forEach((element, idx) => {
      const x = spacing * (idx + 1);

      // Event circle
      ctx.fillStyle = '#C0614B';
      ctx.beginPath();
      ctx.arc(x, centerY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Event label
      ctx.fillStyle = '#272320';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(element.label, x, centerY - 30);

      // Event description
      ctx.font = '10px Inter';
      ctx.fillStyle = '#5C4033';
      const desc = element.description.substring(0, 30) + (element.description.length > 30 ? '...' : '');
      ctx.fillText(desc, x, centerY + 30);
    });
  };

  const drawHierarchy = (ctx: CanvasRenderingContext2D, width: number, height: number, elements: any[]) => {
    const padding = 40;
    const boxWidth = (width - padding * 2) / Math.max(elements.length, 1);
    const boxHeight = 60;

    elements.forEach((element, idx) => {
      const x = padding + idx * boxWidth + boxWidth / 2 - 50;
      const y = height / 2 - boxHeight / 2;

      // Box
      ctx.fillStyle = '#FDFCF8';
      ctx.strokeStyle = '#C0614B';
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, 100, boxHeight);
      ctx.strokeRect(x, y, 100, boxHeight);

      // Text
      ctx.fillStyle = '#272320';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(element.label, x + 50, y + 20);

      ctx.font = '9px Inter';
      ctx.fillStyle = '#5C4033';
      ctx.fillText(element.description.substring(0, 15), x + 50, y + 40);

      // Connector lines
      if (idx < elements.length - 1) {
        ctx.strokeStyle = '#E5E0D8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 100, y + boxHeight / 2);
        ctx.lineTo(x + boxWidth, y + boxHeight / 2);
        ctx.stroke();
      }
    });
  };

  const drawProcess = (ctx: CanvasRenderingContext2D, width: number, height: number, elements: any[]) => {
    const padding = 40;
    const stepHeight = (height - padding * 2) / elements.length;

    elements.forEach((element, idx) => {
      const y = padding + idx * stepHeight + stepHeight / 2;
      const x = width / 2;

      // Step number circle
      ctx.fillStyle = '#C0614B';
      ctx.beginPath();
      ctx.arc(40, y, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FDFCF8';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), 40, y);

      // Step box
      ctx.fillStyle = '#FAFAFA';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 1;
      ctx.fillRect(70, y - 25, width - 120, 50);
      ctx.strokeRect(70, y - 25, width - 120, 50);

      // Step text
      ctx.fillStyle = '#272320';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(element.label, 80, y - 10);

      ctx.font = '9px Inter';
      ctx.fillStyle = '#5C4033';
      ctx.fillText(element.description.substring(0, 40), 80, y + 10);

      // Arrow to next step
      if (idx < elements.length - 1) {
        ctx.strokeStyle = '#C0614B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, y + 15);
        ctx.lineTo(40, y + stepHeight - 15);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = '#C0614B';
        ctx.beginPath();
        ctx.moveTo(40, y + stepHeight - 15);
        ctx.lineTo(35, y + stepHeight - 25);
        ctx.lineTo(45, y + stepHeight - 25);
        ctx.fill();
      }
    });
  };

  if (!infographicData) {
    return (
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 text-center">
        <p className="text-sm text-earth-brown/60 font-light">
          Infographics will be generated based on the wiki's structure.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
      <div className="mb-4">
        <h3 className="font-bold text-earth-brown mb-1">Visual Summary</h3>
        <p className="text-xs text-earth-brown/50 font-light">
          {infographicData.type === 'timeline' && 'Timeline of key events'}
          {infographicData.type === 'hierarchy' && 'Hierarchical structure'}
          {infographicData.type === 'process' && 'Step-by-step process'}
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full border border-gray-100 rounded-lg bg-[#FAFAFA]"
      />

      <p className="text-xs text-earth-brown/50 text-center mt-4 font-light">
        This infographic summarizes the core {infographicData.type} of the article for visual learners.
      </p>
    </div>
  );
};
