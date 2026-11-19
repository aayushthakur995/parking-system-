#ifndef GRAPH_H
#define GRAPH_H

#include <string>
#include <unordered_map>
#include <vector>

struct Edge {
    std::string to;
    int weight;
};

struct NodeMeta {
    std::string id;
    std::string label;
    std::string kind; // "entrance" | "aisle" | "slot"
    int x;
    int y;
};

class Graph {
public:
    Graph();

    void addNode(const std::string& id, const std::string& label, const std::string& kind, int x, int y);
    void addUndirectedEdge(const std::string& u, const std::string& v, int weight);

    bool hasNode(const std::string& id) const;
    const std::vector<Edge>& getNeighbors(const std::string& id) const;
    std::vector<std::string> getAllNodeIds() const;
    const std::unordered_map<std::string, NodeMeta>& getNodesMeta() const;
    const std::unordered_map<std::string, std::vector<Edge>>& getAdjacencyList() const;

    // Builds the standard 5x5 Park Smart lot topology (ENTRANCE, A1..C5 aisles, P01..P25 slots)
    static Graph buildParkingLotGraph();

private:
    std::unordered_map<std::string, std::vector<Edge>> adj_;
    std::unordered_map<std::string, NodeMeta> nodes_;
    static const std::vector<Edge> emptyEdges_;
};

#endif // GRAPH_H
