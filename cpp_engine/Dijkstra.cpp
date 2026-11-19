#include "Dijkstra.h"
#include <algorithm>
#include <limits>
#include <queue>
#include <unordered_map>
#include <unordered_set>

DijkstraResult Dijkstra::findShortestPath(
    const Graph& graph,
    const std::string& source,
    const std::string& destination
) {
    DijkstraResult result;
    result.source = source;
    result.destination = destination;

    if (!graph.hasNode(source) || !graph.hasNode(destination)) {
        return result;
    }

    const int INF = std::numeric_limits<int>::max();
    std::unordered_map<std::string, int> dist;
    std::unordered_map<std::string, std::string> parent;
    std::unordered_set<std::string> visited;

    for (const auto& id : graph.getAllNodeIds()) {
        dist[id] = INF;
    }

    // Min-heap priority queue storing (distance, nodeId)
    using State = std::pair<int, std::string>;
    std::priority_queue<State, std::vector<State>, std::greater<State>> minHeap;

    dist[source] = 0;
    minHeap.push({0, source});

    while (!minHeap.empty()) {
        auto [currentDist, u] = minHeap.top();
        minHeap.pop();

        // Skip stale queue entries once a shorter path to u has already been settled
        if (visited.find(u) != visited.end()) {
            continue;
        }
        visited.insert(u);
        result.exploredNodes.push_back(u);

        if (u == destination) {
            break;
        }

        for (const auto& edge : graph.getNeighbors(u)) {
            if (visited.find(edge.to) != visited.end()) {
                continue;
            }
            if (currentDist != INF && currentDist + edge.weight < dist[edge.to]) {
                dist[edge.to] = currentDist + edge.weight;
                parent[edge.to] = u;
                minHeap.push({dist[edge.to], edge.to});
            }
        }
    }

    if (dist[destination] == INF) {
        return result;
    }

    result.reachable = true;
    result.shortestDistance = dist[destination];

    // Reconstruct path from destination back to source
    std::vector<std::string> revPath;
    std::string curr = destination;
    while (true) {
        revPath.push_back(curr);
        if (curr == source) {
            break;
        }
        auto pIt = parent.find(curr);
        if (pIt == parent.end()) {
            break;
        }
        curr = pIt->second;
    }

    std::reverse(revPath.begin(), revPath.end());
    result.path = std::move(revPath);
    return result;
}
