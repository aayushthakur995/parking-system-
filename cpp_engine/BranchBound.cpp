#include "BranchBound.h"
#include <algorithm>
#include <chrono>
#include <limits>

namespace {
const size_t MAX_TRACE_STEPS = 60;

int computeLowerBound(
    int currIdx,
    int currentCost,
    const std::vector<bool>& visited,
    const std::vector<int>& minOutgoing
) {
    // Admissible lower bound:
    // currentCost + minimum outgoing cost from currIdx + sum of minimum outgoing costs from every unvisited node
    int lb = currentCost + minOutgoing[currIdx];
    int n = static_cast<int>(visited.size());
    for (int i = 1; i < n; ++i) {
        if (!visited[i]) {
            lb += minOutgoing[i];
        }
    }
    return lb;
}

void branchAndBoundSearch(
    int currIdx,
    int depth,
    int totalCheckpoints,
    int currentCost,
    const std::vector<std::vector<int>>& distMatrix,
    const std::vector<int>& minOutgoing,
    const std::vector<std::string>& nodes,
    std::vector<bool>& visited,
    std::vector<int>& currentPath,
    int& bestCost,
    std::vector<int>& bestPath,
    long long& branchesExplored,
    long long& branchesPruned,
    std::vector<BBTraceStep>& traceSteps
) {
    branchesExplored++;

    int lb = computeLowerBound(currIdx, currentCost, visited, minOutgoing);

    auto buildRouteNames = [&](const std::vector<int>& idxPath) {
        std::vector<std::string> names;
        names.reserve(idxPath.size());
        for (int idx : idxPath) {
            names.push_back(nodes[idx]);
        }
        return names;
    };

    // Prune branch if its optimistic lower bound cannot beat current best complete tour
    if (bestCost != std::numeric_limits<int>::max() && lb >= bestCost) {
        branchesPruned++;
        if (traceSteps.size() < MAX_TRACE_STEPS) {
            traceSteps.push_back(BBTraceStep{
                buildRouteNames(currentPath),
                currentCost,
                lb,
                bestCost,
                "PRUNE"
            });
        }
        return;
    }

    if (depth == totalCheckpoints) {
        int returnCost = distMatrix[currIdx][0];
        if (returnCost >= 0) {
            int totalCost = currentCost + returnCost;
            if (totalCost < bestCost) {
                bestCost = totalCost;
                bestPath = currentPath;
                bestPath.push_back(0);
                if (traceSteps.size() < MAX_TRACE_STEPS) {
                    traceSteps.push_back(BBTraceStep{
                        buildRouteNames(bestPath),
                        totalCost,
                        totalCost,
                        bestCost,
                        "BEST_UPDATED"
                    });
                }
            }
        }
        return;
    }

    if (traceSteps.size() < MAX_TRACE_STEPS) {
        traceSteps.push_back(BBTraceStep{
            buildRouteNames(currentPath),
            currentCost,
            lb,
            bestCost == std::numeric_limits<int>::max() ? -1 : bestCost,
            "EXPLORE"
        });
    }

    // Order candidate next nodes by nearest distance first to tighten upper bound early
    int n = static_cast<int>(distMatrix.size());
    std::vector<std::pair<int, int>> candidates;
    for (int nextIdx = 1; nextIdx < n; ++nextIdx) {
        if (!visited[nextIdx] && distMatrix[currIdx][nextIdx] >= 0) {
            candidates.push_back({distMatrix[currIdx][nextIdx], nextIdx});
        }
    }
    std::sort(candidates.begin(), candidates.end());

    for (const auto& cand : candidates) {
        int edgeCost = cand.first;
        int nextIdx = cand.second;

        visited[nextIdx] = true;
        currentPath.push_back(nextIdx);

        branchAndBoundSearch(
            nextIdx,
            depth + 1,
            totalCheckpoints,
            currentCost + edgeCost,
            distMatrix,
            minOutgoing,
            nodes,
            visited,
            currentPath,
            bestCost,
            bestPath,
            branchesExplored,
            branchesPruned,
            traceSteps
        );

        currentPath.pop_back();
        visited[nextIdx] = false;
    }
}
} // namespace

BranchBoundResult BranchBound::solveTSP(
    const Graph& graph,
    const std::string& startNode,
    const std::vector<std::string>& checkpoints
) {
    BranchBoundResult res;
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
    std::vector<std::vector<int>> distMatrix = TSP::buildDistanceMatrix(graph, nodes, pathMatrix);

    int n = static_cast<int>(nodes.size());
    std::vector<int> minOutgoing(n, std::numeric_limits<int>::max());
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            if (i != j && distMatrix[i][j] >= 0) {
                minOutgoing[i] = std::min(minOutgoing[i], distMatrix[i][j]);
            }
        }
        if (minOutgoing[i] == std::numeric_limits<int>::max()) {
            return res;
        }
    }

    int totalCheckpoints = n - 1;
    std::vector<bool> visited(n, false);
    visited[0] = true;
    std::vector<int> currentPath = {0};
    std::vector<int> bestPath;
    int bestCost = std::numeric_limits<int>::max();

    auto tStart = std::chrono::steady_clock::now();
    branchAndBoundSearch(
        0,
        0,
        totalCheckpoints,
        0,
        distMatrix,
        minOutgoing,
        nodes,
        visited,
        currentPath,
        bestCost,
        bestPath,
        res.branchesExplored,
        res.branchesPruned,
        res.traceSteps
    );
    auto tEnd = std::chrono::steady_clock::now();

    res.executionTimeUs = std::chrono::duration_cast<std::chrono::microseconds>(tEnd - tStart).count();

    if (bestCost == std::numeric_limits<int>::max() || bestPath.empty()) {
        return res;
    }

    res.valid = true;
    res.totalCost = bestCost;

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
