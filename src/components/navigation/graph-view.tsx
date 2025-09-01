/**
 * Graph View Component (Level 3)
 * Visual graph representation of page connections
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { GraphNode, GraphEdge } from '@/types/progressive-zooming';

interface GraphViewProps {
  graphData: { nodes: GraphNode[], edges: GraphEdge[] };
  onNodeSelect: (nodeId: string) => void;
  isActive: boolean;
}

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}

export function GraphView({ graphData, onNodeSelect, isActive }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [positionedNodes, setPositionedNodes] = useState<PositionedNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Simple force-directed layout algorithm
  useEffect(() => {
    if (!graphData.nodes.length) return;

    const { nodes, edges } = graphData;
    const { width, height } = dimensions;
    
    // Initialize positions randomly
    const positioned: PositionedNode[] = nodes.map(node => ({
      ...node,
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50
    }));

    // Simple force simulation (simplified version)
    const iterations = 50;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < iterations; i++) {
      // Repulsion between nodes
      for (let j = 0; j < positioned.length; j++) {
        for (let k = j + 1; k < positioned.length; k++) {
          const nodeA = positioned[j];
          const nodeB = positioned[k];
          
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (distance < 100) {
            const force = (100 - distance) / distance * 0.5;
            const fx = dx * force;
            const fy = dy * force;
            
            nodeA.x -= fx;
            nodeA.y -= fy;
            nodeB.x += fx;
            nodeB.y += fy;
          }
        }
      }

      // Attraction for connected nodes
      edges.forEach(edge => {
        const sourceNode = positioned.find(n => n.id === edge.source);
        const targetNode = positioned.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const idealDistance = 150;
          const force = (distance - idealDistance) / distance * 0.1;
          const fx = dx * force;
          const fy = dy * force;
          
          sourceNode.x += fx;
          sourceNode.y += fy;
          targetNode.x -= fx;
          targetNode.y -= fy;
        }
      });

      // Center gravity
      positioned.forEach(node => {
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.x += dx * 0.01;
        node.y += dy * 0.01;
      });

      // Keep nodes within bounds
      positioned.forEach(node => {
        node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));
      });
    }

    setPositionedNodes(positioned);
  }, [graphData, dimensions]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    onNodeSelect(nodeId);
  };

  const getNodeSize = (node: PositionedNode) => {
    // Size based on weight (connections + content)
    return Math.max(20, Math.min(40, 20 + node.weight * 2));
  };

  const getNodeColor = (node: PositionedNode) => {
    if (selectedNode === node.id) return '#3b82f6'; // Primary blue
    if (node.connections.length > 2) return '#10b981'; // Green for highly connected
    if (node.connections.length > 0) return '#f59e0b'; // Amber for connected
    return '#6b7280'; // Gray for isolated
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "h-full relative bg-background",
        !isActive && "pointer-events-none"
      )}
    >
      {graphData.nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold mb-2">Ingen karta än</h3>
            <p className="text-muted-foreground">
              Skapa kopplingar mellan dina sidor för att se kartvy
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* SVG Graph */}
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="absolute inset-0"
          >
            {/* Edges */}
            <g>
              {graphData.edges.map((edge, index) => {
                const sourceNode = positionedNodes.find(n => n.id === edge.source);
                const targetNode = positionedNodes.find(n => n.id === edge.target);
                
                if (!sourceNode || !targetNode) return null;
                
                return (
                  <line
                    key={`edge-${index}`}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke="#e5e7eb"
                    strokeWidth={Math.max(1, edge.strength * 2)}
                    opacity={0.6}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {positionedNodes.map(node => (
                <g key={node.id}>
                  {/* Node circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={getNodeSize(node)}
                    fill={getNodeColor(node)}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleNodeClick(node.id)}
                  />
                  
                  {/* Node emoji */}
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    fontSize="16"
                    className="pointer-events-none select-none"
                  >
                    {node.emoji}
                  </text>
                </g>
              ))}
            </g>
          </svg>

          {/* Node Labels */}
          {positionedNodes.map(node => (
            <div
              key={`label-${node.id}`}
              className="absolute pointer-events-none select-none"
              style={{
                left: node.x - 50,
                top: node.y + getNodeSize(node) + 10,
                width: 100
              }}
            >
              <div className="text-xs text-center bg-background/80 backdrop-blur-sm rounded px-2 py-1 border border-border">
                {node.title}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg">
            <h4 className="text-sm font-semibold mb-3">Förklaring</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span>Många kopplingar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                <span>Några kopplingar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                <span>Inga kopplingar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span>Vald sida</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 shadow-lg">
            <p className="text-xs text-muted-foreground">
              Klicka på en nod för att öppna sidan
            </p>
          </div>
        </>
      )}
    </div>
  );
}