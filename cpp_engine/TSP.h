#ifndef TSP_H
#define TSP_H

#include "Graph.h"
#include <string>
#include <vector>

struct TSPLeg {
    std::string from;
    std::string to;
    int distance;
    std::vector<std::string> path;
};

struct TSPResult {
    bool valid = false;
    std::string startNode;
    std::vector<std::string> checkpoints;
    std::vector<std::string> optimalRoute; // Sequence starting & ending at startNode
    int totalDistance = 0;
    long long toursEvaluated = 0;
    long long executionTimeUs = 0;
    std::vector<TSPLeg> legs;
};

class TSP {
public:
    // Builds pairwise shortest-path distance matrix among nodes[0]=startNode and checkpoints
    static std::vector<std::vector<int>> buildDistanceMatrix(
        const Graph& graph,
        const std::vector<std::string>& nodes,
        std::vector<std::vector<std::vector<std::string>>>& pathMatrix
    );

    // Brute Force TSP via recursive backtracking over all permutations
    static TSPResult solveBruteForce(
        const Graph& graph,
        const std::string& startNode,
        const std::vector<std::string>& checkpoints
    );
};

#endif // TSP_H
