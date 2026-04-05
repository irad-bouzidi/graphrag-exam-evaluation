'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getGraphVisualization, getGraphOverview } from '@/lib/api'
import Link from 'next/link'
import { Network, RefreshCw } from 'lucide-react'

// Colors for different node types
const NODE_COLORS: Record<string, string> = {
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

export default function GraphPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<any>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const { data: overview } = useQuery({
    queryKey: ['graph-overview'],
    queryFn: async () => {
      const response = await getGraphOverview()
      return response.data
    },
  })

  const { data: graphData, isLoading, refetch } = useQuery({
    queryKey: ['graph-visualization', selectedType],
    queryFn: async () => {
      const response = await getGraphVisualization({
        node_type: selectedType || undefined,
        limit: 100,
      })
      return response.data
    },
  })

  useEffect(() => {
    if (!graphData || !containerRef.current) return

    // Dynamically import vis-network
    import('vis-network/standalone').then((vis) => {
      const nodesArray = graphData.nodes
          ?.filter((n: any) => n && n.id)
          .map((node: any) => ({
            id: node.id,
            label: node.properties?.name || node.properties?.title || node.properties?.id || `${node.label}`,
            color: NODE_COLORS[node.label] || '#6b7280',
            group: node.label,
            title: `${node.label}: ${JSON.stringify(node.properties, null, 2)}`,
          })) || []

      const edgesArray = graphData.edges
          ?.filter((e: any) => e && e.source && e.target)
          .map((edge: any) => ({
            id: edge.id,
            from: edge.source,
            to: edge.target,
            label: edge.type,
            font: { size: 10 },
            arrows: 'to',
          })) || []

      const nodes = new vis.DataSet(nodesArray)
      const edges = new vis.DataSet(edgesArray)

      const options = {
        nodes: {
          shape: 'dot',
          size: 20,
          font: {
            size: 12,
            color: '#333',
          },
          borderWidth: 2,
        },
        edges: {
          width: 1,
          color: { inherit: 'from' },
          smooth: {
            type: 'continuous',
          },
        },
        physics: {
          stabilization: false,
          barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.3,
            springLength: 150,
            springConstant: 0.04,
          },
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
        },
        groups: Object.fromEntries(
          Object.entries(NODE_COLORS).map(([label, color]) => [
            label,
            { color: { background: color, border: color } },
          ])
        ),
      }

      if (networkRef.current) {
        networkRef.current.destroy()
      }

      networkRef.current = new vis.Network(
        containerRef.current!,
        { nodes: nodes as any, edges: edges as any },
        options as any
      )
    })

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy()
        networkRef.current = null
      }
    }
  }, [graphData])

  const nodeTypes = overview?.nodes?.filter((n: any) => n.count > 0) || []
  const totalNodes = overview?.nodes?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0
  const totalEdges = overview?.relationships?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-gray-600">
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Graph Explorer</h1>
                <p className="text-gray-500">Explore data relationships</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="btn btn-secondary"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Filter */}
            <div className="card">
              <div className="card-header">Filter by Type</div>
              <div className="card-body space-y-2">
                <button
                  onClick={() => setSelectedType(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !selectedType
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  All Nodes
                </button>
                {nodeTypes.map((type: any) => (
                  <button
                    key={type.label}
                    onClick={() => setSelectedType(type.label)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      selectedType === type.label
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: NODE_COLORS[type.label] || '#6b7280' }}
                      />
                      {type.label}
                    </div>
                    <span className="text-gray-400">{type.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="card">
              <div className="card-header">Legend</div>
              <div className="card-body">
                <div className="space-y-2 text-sm">
                  {Object.entries(NODE_COLORS).map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="card">
              <div className="card-header">Statistics</div>
              <div className="card-body">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nodes</span>
                    <span className="font-medium">
                      {totalNodes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Edges</span>
                    <span className="font-medium">
                      {totalEdges}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graph */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="card-body p-0">
                {isLoading ? (
                  <div className="h-[600px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : !graphData?.nodes?.length ? (
                  <div className="h-[600px] flex flex-col items-center justify-center text-gray-500">
                    <Network className="w-12 h-12 mb-4 text-gray-300" />
                    <p>No data to display</p>
                    <p className="text-sm mt-1">
                      Create exams and submissions to see the graph
                    </p>
                  </div>
                ) : (
                  <div ref={containerRef} className="h-[600px]" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
