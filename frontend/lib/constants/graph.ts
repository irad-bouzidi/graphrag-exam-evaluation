/**
 * Graph visualization constants
 */

/**
 * Node colors for different entity types in the knowledge graph
 */
export const NODE_COLORS: Record<string, string> = {
  Student: '#3b82f6',
  Exam: '#22c55e',
  Submission: '#f59e0b',
  Correction: '#ef4444',
  Question: '#8b5cf6',
  Answer: '#ec4899',
  Skill: '#06b6d4',
  Topic: '#14b8a6',
  ErrorType: '#f97316',
}

/**
 * Default node color for unknown types
 */
export const DEFAULT_NODE_COLOR = '#6b7280'

/**
 * Node visual configuration for vis-network
 */
export const NODE_VISUAL_CONFIG = {
  shape: 'dot',
  size: 20,
  font: {
    size: 12,
    color: '#333',
  },
  borderWidth: 2,
}

/**
 * Edge visual configuration for vis-network
 */
export const EDGE_VISUAL_CONFIG = {
  width: 1,
  color: { inherit: 'from' },
  smooth: {
    type: 'continuous',
  },
}

/**
 * Physics configuration for vis-network
 */
export const GRAPH_PHYSICS_CONFIG = {
  stabilization: false,
  barnesHut: {
    gravitationalConstant: -2000,
    centralGravity: 0.3,
    springLength: 150,
    springConstant: 0.04,
  },
}

/**
 * Interaction configuration for vis-network
 */
export const GRAPH_INTERACTION_CONFIG = {
  hover: true,
  tooltipDelay: 200,
}

/**
 * Get color for a node type
 */
export function getNodeColor(nodeType: string): string {
  return NODE_COLORS[nodeType] || DEFAULT_NODE_COLOR
}

/**
 * All available node types
 */
export const NODE_TYPES = Object.keys(NODE_COLORS) as (keyof typeof NODE_COLORS)[]