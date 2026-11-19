import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient.ts';
import {
  BranchBoundComparisonResponse,
  DijkstraResponse,
  GraphResponse,
  ParkingSlot,
  RankedSlot,
  TSPResponse,
} from '../types.ts';

type LabTab = 'dijkstra' | 'greedy' | 'tsp' | 'branch-bound';

interface AlgorithmLabProps {
  slots: ParkingSlot[];
}

const SLOT_IDS = Array.from({ length: 25 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`);

export function AlgorithmLab({ slots }: AlgorithmLabProps) {
  const [activeTab, setActiveTab] = useState<LabTab>('dijkstra');
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [graphError, setGraphError] = useState('');

  // A. Dijkstra state
  const [dijkSource, setDijkSource] = useState('ENTRANCE');
  const [dijkDest, setDijkDest] = useState('P13');
  const [dijkResult, setDijkResult] = useState<DijkstraResponse | null>(null);
  const [dijkLoading, setDijkLoading] = useState(false);
  const [dijkError, setDijkError] = useState('');
  const [showEdgesTable, setShowEdgesTable] = useState(false);

  // B. Greedy state
  const [greedyDistWeight, setGreedyDistWeight] = useState(0.5);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [greedyResults, setGreedyResults] = useState<RankedSlot[] | null>(null);
  const [greedyWeightsUsed, setGreedyWeightsUsed] = useState<{ dw: number; pw: number } | null>(null);
  const [greedyLoading, setGreedyLoading] = useState(false);
  const [greedyError, setGreedyError] = useState('');

  // C. TSP state
  const [tspCheckpoints, setTspCheckpoints] = useState<string[]>(['P02', 'P08', 'P13', 'P21']);
  const [tspResult, setTspResult] = useState<TSPResponse | null>(null);
  const [tspLoading, setTspLoading] = useState(false);
  const [tspError, setTspError] = useState('');

  // D. Branch & Bound state
  const [bbCheckpoints, setBbCheckpoints] = useState<string[]>(['P02', 'P08', 'P13', 'P21', 'P24']);
  const [bbResult, setBbResult] = useState<BranchBoundComparisonResponse | null>(null);
  const [bbLoading, setBbLoading] = useState(false);
  const [bbError, setBbError] = useState('');

  useEffect(() => {
    apiFetch<GraphResponse>('/api/lab/graph')
      .then((data) => setGraphData(data))
      .catch((err) => setGraphError(err?.message || 'Failed to load parking graph.'));
  }, []);

  const runDijkstra = async () => {
    setDijkLoading(true);
    setDijkError('');
    try {
      const data = await apiFetch<DijkstraResponse>('/api/lab/dijkstra', {
        method: 'POST',
        body: JSON.stringify({ source: dijkSource, destination: dijkDest }),
      });
      setDijkResult(data);
    } catch (err: any) {
      setDijkError(err?.message || 'Failed to run Dijkstra.');
    } finally {
      setDijkLoading(false);
    }
  };

  const runGreedy = async () => {
    setGreedyLoading(true);
    setGreedyError('');
    try {
      const data = await apiFetch<{
        distanceWeight: number;
        priceWeight: number;
        rankedSlots: RankedSlot[];
      }>('/api/lab/greedy', {
        method: 'POST',
        body: JSON.stringify({ distanceWeight: greedyDistWeight, onlyAvailable }),
      });
      setGreedyResults(data.rankedSlots);
      setGreedyWeightsUsed({ dw: data.distanceWeight, pw: data.priceWeight });
    } catch (err: any) {
      setGreedyError(err?.message || 'Failed to run Greedy ranking.');
    } finally {
      setGreedyLoading(false);
    }
  };

  const toggleCheckpoint = (
    id: string,
    list: string[],
    setter: (next: string[]) => void
  ) => {
    if (list.includes(id)) {
      setter(list.filter((c) => c !== id));
    } else if (list.length < 7) {
      setter([...list, id]);
    }
  };

  const runTSP = async () => {
    setTspLoading(true);
    setTspError('');
    try {
      const data = await apiFetch<TSPResponse>('/api/lab/tsp', {
        method: 'POST',
        body: JSON.stringify({ checkpoints: tspCheckpoints }),
      });
      setTspResult(data);
    } catch (err: any) {
      setTspError(err?.message || 'Failed to run TSP.');
    } finally {
      setTspLoading(false);
    }
  };

  const runBranchBound = async () => {
    setBbLoading(true);
    setBbError('');
    try {
      const data = await apiFetch<BranchBoundComparisonResponse>('/api/lab/branch-bound', {
        method: 'POST',
        body: JSON.stringify({ checkpoints: bbCheckpoints }),
      });
      setBbResult(data);
    } catch (err: any) {
      setBbError(err?.message || 'Failed to run Branch and Bound.');
    } finally {
      setBbLoading(false);
    }
  };

  // Helpers for SVG Graph visualization
  const isEdgeOnPath = (u: string, v: string, path: string[]) => {
    for (let i = 0; i + 1 < path.length; i++) {
      if ((path[i] === u && path[i + 1] === v) || (path[i] === v && path[i + 1] === u)) {
        return true;
      }
    }
    return false;
  };

  const getSvgCoords = (x: number, y: number) => ({
    cx: 65 + x * 125,
    cy: 45 + y * 58,
  });

  return (
    <div>
      <div className="subtabs">
        <button
          type="button"
          className={`subtab-btn ${activeTab === 'dijkstra' ? 'active' : ''}`}
          onClick={() => setActiveTab('dijkstra')}
        >
          A. Dijkstra&apos;s Shortest Path
        </button>
        <button
          type="button"
          className={`subtab-btn ${activeTab === 'greedy' ? 'active' : ''}`}
          onClick={() => setActiveTab('greedy')}
        >
          B. Greedy Slot Ranking
        </button>
        <button
          type="button"
          className={`subtab-btn ${activeTab === 'tsp' ? 'active' : ''}`}
          onClick={() => setActiveTab('tsp')}
        >
          C. Travelling Salesman Problem (TSP)
        </button>
        <button
          type="button"
          className={`subtab-btn ${activeTab === 'branch-bound' ? 'active' : ''}`}
          onClick={() => setActiveTab('branch-bound')}
        >
          D. Branch and Bound
        </button>
      </div>

      {graphError && <div className="alert alert-error">{graphError}</div>}

      {/* SECTION A: DIJKSTRA */}
      {activeTab === 'dijkstra' && (
        <div>
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Dijkstra&apos;s Shortest Path (C++17 Priority Queue)</h2>
              <span className="panel-note">
                {graphData
                  ? `${graphData.nodeCount} Graph Nodes, ${graphData.edgeCount} Weighted Edges`
                  : 'Loading graph...'}
              </span>
            </div>

            <div className="viva-note">
              <strong>Algorithm Purpose:</strong> Computes the shortest driving path from the source
              node to a target parking slot using an adjacency list and a min-heap priority queue
              (Time Complexity: <span className="mono">O((V + E) log V)</span>).
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="dj-src">
                  Source Node
                </label>
                <select
                  id="dj-src"
                  className="select mono"
                  value={dijkSource}
                  onChange={(e) => setDijkSource(e.target.value)}
                >
                  <option value="ENTRANCE">ENTRANCE</option>
                  {graphData?.nodes
                    .filter((n) => n.id !== 'ENTRANCE')
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.id} ({n.kind})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dj-dst">
                  Destination Slot / Node
                </label>
                <select
                  id="dj-dst"
                  className="select mono"
                  value={dijkDest}
                  onChange={(e) => setDijkDest(e.target.value)}
                >
                  {SLOT_IDS.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={runDijkstra}
                  disabled={dijkLoading}
                >
                  {dijkLoading ? 'Running C++17...' : 'Run Dijkstra'}
                </button>
              </div>

              <div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowEdgesTable((prev) => !prev)}
                >
                  {showEdgesTable ? 'Hide Edge Table' : 'View Graph Edges'}
                </button>
              </div>
            </div>

            {dijkError && <div className="alert alert-error">{dijkError}</div>}

            {dijkResult && (
              <div className="kv-list" style={{ marginTop: '10px' }}>
                <div className="kv-label">Source &rarr; Target:</div>
                <div className="mono">
                  {dijkResult.source} &rarr; {dijkResult.destination}
                </div>

                <div className="kv-label">Shortest Distance:</div>
                <div className="mono">
                  <strong>{dijkResult.shortestDistance} meters</strong>
                </div>

                <div className="kv-label">Final Route:</div>
                <div className="route-box">{dijkResult.path.join(' -> ')}</div>

                <div className="kv-label">
                  Nodes Explored ({dijkResult.exploredCount}):
                </div>
                <div className="route-box">{dijkResult.exploredNodes.join(', ')}</div>
              </div>
            )}
          </div>

          {graphData && (
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">Parking Network Graph Representation</h2>
                <span className="panel-note">
                  Blue thick edges = Shortest path | Amber outline = Explored nodes
                </span>
              </div>

              <div className="graph-svg-wrap">
                <svg width="760" height="475" viewBox="0 0 760 475">
                  {/* Draw Edges */}
                  {graphData.edges.map((edge) => {
                    const uNode = graphData.nodes.find((n) => n.id === edge.from);
                    const vNode = graphData.nodes.find((n) => n.id === edge.to);
                    if (!uNode || !vNode) return null;
                    const p1 = getSvgCoords(uNode.x, uNode.y);
                    const p2 = getSvgCoords(vNode.x, vNode.y);
                    const onPath =
                      dijkResult?.reachable && isEdgeOnPath(edge.from, edge.to, dijkResult.path);
                    const mx = (p1.cx + p2.cx) / 2;
                    const my = (p1.cy + p2.cy) / 2;

                    return (
                      <g key={`${edge.from}-${edge.to}`}>
                        <line
                          x1={p1.cx}
                          y1={p1.cy}
                          x2={p2.cx}
                          y2={p2.cy}
                          stroke={onPath ? '#1d4ed8' : '#cbd5e1'}
                          strokeWidth={onPath ? 3.5 : 1.5}
                        />
                        <rect
                          x={mx - 9}
                          y={my - 8}
                          width={18}
                          height={15}
                          rx={2}
                          fill="#ffffff"
                          stroke={onPath ? '#1d4ed8' : '#e2e8f0'}
                          strokeWidth={1}
                        />
                        <text
                          x={mx}
                          y={my + 3}
                          textAnchor="middle"
                          fontSize="10"
                          fontFamily="monospace"
                          fill={onPath ? '#1e3a8a' : '#64748b'}
                          fontWeight={onPath ? '700' : '400'}
                        >
                          {edge.weight}
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw Nodes */}
                  {graphData.nodes.map((node) => {
                    const { cx, cy } = getSvgCoords(node.x, node.y);
                    const onPath = dijkResult?.path.includes(node.id);
                    const explored = dijkResult?.exploredNodes.includes(node.id);
                    const isEndpoint =
                      dijkResult && (node.id === dijkResult.source || node.id === dijkResult.destination);

                    let fill = '#ffffff';
                    let stroke = '#64748b';
                    let textColor = '#1e293b';

                    if (node.kind === 'entrance') {
                      fill = '#1b365d';
                      stroke = '#0f172a';
                      textColor = '#ffffff';
                    } else if (node.kind === 'aisle') {
                      fill = '#f1f5f9';
                      stroke = '#94a3b8';
                    }

                    if (explored && !onPath) {
                      stroke = '#d97706';
                    }
                    if (onPath) {
                      fill = isEndpoint ? '#1d4ed8' : '#dbeafe';
                      stroke = '#1d4ed8';
                      textColor = isEndpoint ? '#ffffff' : '#1e3a8a';
                    }

                    const w = node.id === 'ENTRANCE' ? 76 : 42;
                    return (
                      <g key={node.id}>
                        <rect
                          x={cx - w / 2}
                          y={cy - 13}
                          width={w}
                          height={26}
                          rx={4}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={onPath || explored ? 2 : 1}
                        />
                        <text
                          x={cx}
                          y={cy + 4}
                          textAnchor="middle"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="600"
                          fill={textColor}
                        >
                          {node.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {showEdgesTable && graphData && (
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">Graph Edge List (Undirected Weighted Edges)</h2>
                <span className="panel-note">{graphData.edgeCount} edges</span>
              </div>
              <div className="table-wrap" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Node U</th>
                      <th>Node V</th>
                      <th>Distance (meters)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graphData.edges.map((e) => (
                      <tr key={`${e.from}-${e.to}`}>
                        <td className="mono">{e.from}</td>
                        <td className="mono">{e.to}</td>
                        <td className="mono">{e.weight} m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION B: GREEDY WEIGHTED SLOT RANKING */}
      {activeTab === 'greedy' && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Greedy-Based Slot Ranking (C++17)</h2>
            <span className="panel-note">
              Formula: Score = (w_d &times; NormDist) + (w_p &times; NormPrice), where w_d + w_p = 1
            </span>
          </div>

          <div className="viva-note">
            <strong>Viva Explanation:</strong> Each candidate slot&apos;s shortest distance from{' '}
            <span className="mono">ENTRANCE</span> (via Dijkstra) and hourly price are normalized to{' '}
            <span className="mono">[0, 1]</span> using min-max scaling. Lower weighted score means a
            better recommendation. Note that this is a <strong>weighted greedy-style ranking heuristic</strong>{' '}
            for a single incoming driver, not a globally optimal solution across all future vehicle arrivals.
          </div>

          <div className="form-row">
            <div className="form-group grow">
              <label className="form-label" htmlFor="gr-dw">
                Distance Weight (w_d): {greedyDistWeight.toFixed(2)} | Price Weight (w_p):{' '}
                {(1 - greedyDistWeight).toFixed(2)}
              </label>
              <input
                id="gr-dw"
                className="range-input"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={greedyDistWeight}
                onChange={(e) => setGreedyDistWeight(parseFloat(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="gr-avail">
                Candidate Filter
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px' }}>
                <input
                  id="gr-avail"
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                />
                Only Available Slots ({slots.filter((s) => s.status === 'Available').length})
              </label>
            </div>

            <div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={runGreedy}
                disabled={greedyLoading}
              >
                {greedyLoading ? 'Ranking...' : 'Run Greedy Ranking'}
              </button>
            </div>
          </div>

          {greedyError && <div className="alert alert-error">{greedyError}</div>}

          {greedyResults && greedyWeightsUsed && (
            <div>
              <div className="alert alert-info">
                Evaluated <strong>{greedyResults.length}</strong> candidate slots with{' '}
                <span className="mono">
                  w_d = {greedyWeightsUsed.dw.toFixed(2)}, w_p = {greedyWeightsUsed.pw.toFixed(2)}
                </span>
                . Top recommendation: <strong>{greedyResults[0]?.slotId ?? 'None'}</strong>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Slot</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Distance</th>
                      <th>Price</th>
                      <th>Norm. Dist</th>
                      <th>Norm. Price</th>
                      <th>Weighted Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {greedyResults.map((r, i) => (
                      <tr key={r.slotId} className={i === 0 ? 'row-recommended' : ''}>
                        <td>#{i + 1}</td>
                        <td className="mono"><strong>{r.slotId}</strong></td>
                        <td>{r.slotType}</td>
                        <td>{r.status}</td>
                        <td className="mono">{r.distance} m</td>
                        <td className="mono">Rs. {r.price}</td>
                        <td className="mono">{r.normDistance.toFixed(4)}</td>
                        <td className="mono">{r.normPrice.toFixed(4)}</td>
                        <td className="mono"><strong>{r.score.toFixed(4)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION C: TRAVELLING SALESMAN PROBLEM */}
      {activeTab === 'tsp' && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Travelling Salesman Problem — Multi-Checkpoint Tour (C++17)</h2>
            <span className="panel-note">Start &amp; End: ENTRANCE | Exact Brute-Force Permutation</span>
          </div>

          <div className="viva-note">
            <strong>Academic Context:</strong> TSP is used here for a multi-checkpoint patrol,
            valet collection, or EV inspection tour starting at <span className="mono">ENTRANCE</span>,
            visiting every selected slot once, and returning to <span className="mono">ENTRANCE</span>.
            Pairwise shortest distances between checkpoints are computed using Dijkstra&apos;s algorithm.
            (TSP is <em>not</em> used for single-destination parking, where Dijkstra suffices.)
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div className="form-label" style={{ marginBottom: '6px' }}>
              Select 2 to 7 Checkpoints (Selected: {tspCheckpoints.length})
            </div>
            <div className="checkpoint-grid">
              {SLOT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`checkpoint-btn ${tspCheckpoints.includes(id) ? 'selected' : ''}`}
                  onClick={() => toggleCheckpoint(id, tspCheckpoints, setTspCheckpoints)}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <div className="preset-group" style={{ marginBottom: '14px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={runTSP}
              disabled={tspLoading || tspCheckpoints.length < 2}
            >
              {tspLoading ? 'Solving TSP...' : 'Run TSP'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setTspCheckpoints(['P02', 'P08', 'P13', 'P21'])}
            >
              Reset Default (4 Checkpoints)
            </button>
          </div>

          {tspError && <div className="alert alert-error">{tspError}</div>}

          {tspResult && tspResult.valid && (
            <div>
              <div className="kv-list" style={{ marginBottom: '14px' }}>
                <div className="kv-label">Optimal Tour:</div>
                <div className="route-box">{tspResult.optimalRoute.join(' -> ')}</div>

                <div className="kv-label">Total Tour Distance:</div>
                <div className="mono"><strong>{tspResult.totalDistance} meters</strong></div>

                <div className="kv-label">Tours Evaluated:</div>
                <div className="mono">
                  {tspResult.toursEvaluated} ({tspCheckpoints.length}! permutations)
                </div>

                <div className="kv-label">Execution Time:</div>
                <div className="mono">{tspResult.executionTimeUs} microseconds</div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Leg</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Distance</th>
                      <th>Shortest Driving Path (Dijkstra)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tspResult.legs.map((leg, i) => (
                      <tr key={`${leg.from}-${leg.to}-${i}`}>
                        <td>#{i + 1}</td>
                        <td className="mono"><strong>{leg.from}</strong></td>
                        <td className="mono"><strong>{leg.to}</strong></td>
                        <td className="mono">{leg.distance} m</td>
                        <td className="mono">{leg.path.join(' -> ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION D: BRANCH AND BOUND */}
      {activeTab === 'branch-bound' && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Branch and Bound vs. Brute Force TSP (C++17)</h2>
            <span className="panel-note">
              Admissible Lower Bound Pruning on the same checkpoint dataset
            </span>
          </div>

          <div className="viva-note">
            <strong>Lower Bound Formula:</strong>{' '}
            <span className="mono">
              LB = currentCost + minOut(currNode) + &Sigma; minOut(unvisited)
            </span>
            . Whenever <span className="mono">LB &ge; bestCost</span>, the entire subtree is pruned
            without losing optimality. Both algorithms run in C++17 on the exact same checkpoints below.
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div className="form-label" style={{ marginBottom: '6px' }}>
              Select 2 to 7 Checkpoints for Comparison (Selected: {bbCheckpoints.length})
            </div>
            <div className="checkpoint-grid">
              {SLOT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`checkpoint-btn ${bbCheckpoints.includes(id) ? 'selected' : ''}`}
                  onClick={() => toggleCheckpoint(id, bbCheckpoints, setBbCheckpoints)}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <div className="preset-group" style={{ marginBottom: '14px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={runBranchBound}
              disabled={bbLoading || bbCheckpoints.length < 2}
            >
              {bbLoading ? 'Running Comparison...' : 'Run Branch and Bound'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setBbCheckpoints(['P02', 'P08', 'P13', 'P21', 'P24'])}
            >
              5-Checkpoint Preset
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setBbCheckpoints(['P02', 'P05', 'P10', 'P14', 'P21', 'P25'])}
            >
              6-Checkpoint Preset
            </button>
          </div>

          {bbError && <div className="alert alert-error">{bbError}</div>}

          {bbResult && bbResult.branchBound.valid && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--navy)' }}>
                Brute Force vs. Branch and Bound Comparison
              </h3>
              <div className="table-wrap" style={{ marginBottom: '16px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Brute Force TSP</th>
                      <th>Branch and Bound TSP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Optimal Tour Cost</td>
                      <td className="mono"><strong>{bbResult.bruteForce.totalDistance} m</strong></td>
                      <td className="mono"><strong>{bbResult.branchBound.totalCost} m</strong></td>
                    </tr>
                    <tr>
                      <td>Optimal Route</td>
                      <td className="mono">{bbResult.bruteForce.optimalRoute.join(' -> ')}</td>
                      <td className="mono">{bbResult.branchBound.optimalRoute.join(' -> ')}</td>
                    </tr>
                    <tr>
                      <td>Complete Tours / Search Nodes</td>
                      <td className="mono">{bbResult.bruteForce.toursEvaluated} tours evaluated</td>
                      <td className="mono">{bbResult.branchBound.branchesExplored} branches explored</td>
                    </tr>
                    <tr>
                      <td>Branches Pruned</td>
                      <td className="mono">0 (no pruning)</td>
                      <td className="mono"><strong>{bbResult.branchBound.branchesPruned} pruned</strong></td>
                    </tr>
                    <tr>
                      <td>Execution Time</td>
                      <td className="mono">{bbResult.bruteForce.executionTimeUs} &mu;s</td>
                      <td className="mono">{bbResult.branchBound.executionTimeUs} &mu;s</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--navy)' }}>
                Branch and Bound Search &amp; Pruning Trace (First {bbResult.branchBound.traceSteps.length} Steps)
              </h3>
              <div className="table-wrap" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>Partial Route</th>
                      <th>Current Cost</th>
                      <th>Lower Bound (LB)</th>
                      <th>Best Cost (UB)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bbResult.branchBound.traceSteps.map((step, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className="mono">{step.partialRoute.join(' -> ')}</td>
                        <td className="mono">{step.currentCost}</td>
                        <td className="mono">{step.lowerBound}</td>
                        <td className="mono">{step.bestCost < 0 ? 'INF' : step.bestCost}</td>
                        <td>
                          <span
                            className={
                              step.action === 'PRUNE'
                                ? 'tag tag-occupied'
                                : step.action === 'BEST_UPDATED'
                                ? 'tag tag-available'
                                : 'tag tag-recommended'
                            }
                          >
                            {step.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
