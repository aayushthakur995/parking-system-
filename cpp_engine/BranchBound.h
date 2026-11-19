#ifndef BRANCH_BOUND_H
#define BRANCH_BOUND_H

#include "Graph.h"
#include "TSP.h"
#include <string>
#include <vector>

struct BBTraceStep {
    std::vector<std::string> partialRoute;
    int currentCost;
    int lowerBound;
    int bestCost;
    std::string action; // "EXPLORE" | "PRUNE" | "BEST_UPDATED"
};

struct BranchBoundResult {
    bool valid = false;
    std::string startNode;
    std::vector<std::string> checkpoints;
    std::vector<std::string> optimalRoute;
    int totalCost = 0;
    long long branchesExplored = 0;
    long long branchesPruned = 0;
    long long executionTimeUs = 0;
    std::vector<TSPLeg> legs;
    std::vector<BBTraceStep> traceSteps;
};

class BranchBound {
public:
    static BranchBoundResult solveTSP(
        const Graph& graph,
        const std::string& startNode,
        const std::vector<std::string>& checkpoints
    );
};

#endif // BRANCH_BOUND_H
