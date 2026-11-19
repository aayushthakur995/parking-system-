#include "TSP.h"
#include "Dijkstra.h"
#include <chrono>
#include <limits>

namespace {
void bruteForceBacktrack(
    int currIdx,
    int depth,
    int totalCheckpoints,
    int currentCost,
    const std::vector<std::vector<int>>& distMatrix,
    std::vector<bool>& visited,
    std::vector<int>& currentPath,
    int& bestCost,
    std::vector<int>& bestPath,
    long long& toursEvaluated
) {
    if (depth == totalCheckpoints) {
        // Complete the Hamiltonian cycle by returning to start node (index 0)
        int returnCost = distMatrix[currIdx][0];
        if (returnCost >= 0) {
            toursEvaluated++;
            int totalCost = currentCost + returnCost;
            if (totalCost < bestCost) {
                bestCost = totalCost;
                bestPath = currentPath;
                bestPath.push_back(0);
            }
        }
        return;
    }

    int n = static_cast<int>(distMatrix.size());
    for (int nextIdx = 1; nextIdx < n; ++nextIdx) {
        if (!visited[nextIdx] && distMatrix[currIdx][nextIdx] >= 0) {
            visited[nextIdx] = true;
            currentPath.push_back(nextIdx);

            bruteForceBacktrack(
                nextIdx,
                depth + 1,
                totalCheckpoints,
                currentCost + distMatrix[currIdx][nextIdx],
                distMatrix,
                visited,
                currentPath,
                bestCost,
                bestPath,
                toursEvaluated
            );

            currentPath.pop_back();
            visited[nextIdx] = false;
        }
    }
}
} // namespace

std::vector<std::vector<int>> TSP::buildDistanceMatrix(
    const Graph& graph,
    const std::vector<std::string>& nodes,
    std::vector<std::vector<std::vector<std::string>>>& pathMatrix
) {
    int n = static_cast<int>(nodes.size());
    std::vector<std::vector<int>> distMatrix(n, std::vector<int>(n, -1));
    pathMatrix.assign(n, std::vector<std::vector<std::string>>(n));

    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            if (i == j) {
                distMatrix[i][j] = 0;
                pathMatrix[i][j] = {nodes[i]};
            } else {
                DijkstraResult dRes = Dijkstra::findShortestPath(graph, nodes[i], nodes[j]);
                if (dRes.reachable) {
                    distMatrix[i][j] = dRes.shortestDistance;
                    pathMatrix[i][j] = dRes.path;
                }
            }
        }
    }
    return distMatrix;
}

TSPResult TSP::solveBruteForce(
    const Graph& graph,
    const std::string& startNode,
    const std::vector<std::string>& checkpoints
) {
    TSPResult res;
    res.startNode = startNode;
    res.checkpoints = checkpoints;

    if (checkpoints.empty() || !graph.hasNode(startNode)) {
        return res;
    }

    std::vector<std::string> nodes;
    nodes.push_back(startNode);
    for (const auto& cp : checkpoints) {
        if (!graph.hasNode(cp)) {
            return res;
        }
        nodes.push_back(cp);
    }

    std::vector<std::vector<std::vector<std::string>>> pathMatrix;
    std::vector<std::vector<int>> distMatrix = buildDistanceMatrix(graph, nodes, pathMatrix);

    int n = static_cast<int>(nodes.size());
    int totalCheckpoints = n - 1;
    std::vector<bool> visited(n, false);
    visited[0] = true;

    std::vector<int> currentPath = {0};
    std::vector<int> bestPath;
    int bestCost = std::numeric_limits<int>::max();
    long long toursEvaluated = 0;

    auto tStart = std::chrono::steady_clock::now();
    bruteForceBacktrack(
        0,
        0,
        totalCheckpoints,
        0,
        distMatrix,
        visited,
        currentPath,
        bestCost,
        bestPath,
        toursEvaluated
    );
    auto tEnd = std::chrono::steady_clock::now();

    res.executionTimeUs = std::chrono::duration_cast<std::chrono::microseconds>(tEnd - tStart).count();
    res.toursEvaluated = toursEvaluated;

    if (bestCost == std::numeric_limits<int>::max() || bestPath.empty()) {
        return res;
    }

    res.valid = true;
    res.totalDistance = bestCost;

    for (size_t i = 0; i < bestPath.size(); ++i) {
        res.optimalRoute.push_back(nodes[bestPath[i]]);
        if (i + 1 < bestPath.size()) {
            int u = bestPath[i];
            int v = bestPath[i + 1];
            res.legs.push_back(TSPLeg{nodes[u], nodes[v], distMatrix[u][v], pathMatrix[u][v]});
        }
    }

    return res;
}
