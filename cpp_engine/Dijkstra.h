#ifndef DIJKSTRA_H
#define DIJKSTRA_H

#include "Graph.h"
#include <string>
#include <vector>

struct DijkstraResult {
    bool reachable = false;
    std::string source;
    std::string destination;
    int shortestDistance = -1;
    std::vector<std::string> path;
    std::vector<std::string> exploredNodes;
};

class Dijkstra {
public:
    static DijkstraResult findShortestPath(
        const Graph& graph,
        const std::string& source,
        const std::string& destination
    );
};

#endif // DIJKSTRA_H
