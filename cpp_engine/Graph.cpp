#include "Graph.h"
#include <algorithm>
#include <iomanip>
#include <sstream>

const std::vector<Edge> Graph::emptyEdges_ = {};

Graph::Graph() = default;

void Graph::addNode(const std::string& id, const std::string& label, const std::string& kind, int x, int y) {
    nodes_[id] = NodeMeta{id, label, kind, x, y};
    if (adj_.find(id) == adj_.end()) {
        adj_[id] = {};
    }
}

void Graph::addUndirectedEdge(const std::string& u, const std::string& v, int weight) {
    adj_[u].push_back(Edge{v, weight});
    adj_[v].push_back(Edge{u, weight});
}

bool Graph::hasNode(const std::string& id) const {
    return nodes_.find(id) != nodes_.end();
}

const std::vector<Edge>& Graph::getNeighbors(const std::string& id) const {
    auto it = adj_.find(id);
    if (it == adj_.end()) {
        return emptyEdges_;
    }
    return it->second;
}

std::vector<std::string> Graph::getAllNodeIds() const {
    std::vector<std::string> ids;
    ids.reserve(nodes_.size());
    for (const auto& pair : nodes_) {
        ids.push_back(pair.first);
    }
    std::sort(ids.begin(), ids.end());
    return ids;
}

const std::unordered_map<std::string, NodeMeta>& Graph::getNodesMeta() const {
    return nodes_;
}

const std::unordered_map<std::string, std::vector<Edge>>& Graph::getAdjacencyList() const {
    return adj_;
}

Graph Graph::buildParkingLotGraph() {
    Graph g;

    // 1. Entrance Node (top-left)
    g.addNode("ENTRANCE", "Main Gate Entrance", "entrance", 0, 1);

    // 2. Driving Aisle Junctions (North A1..A5, Middle B1..B5, South C1..C5)
    for (int col = 1; col <= 5; ++col) {
        std::string aId = "A" + std::to_string(col);
        std::string bId = "B" + std::to_string(col);
        std::string cId = "C" + std::to_string(col);

        g.addNode(aId, "North Aisle " + aId, "aisle", col, 1);
        g.addNode(bId, "Middle Aisle " + bId, "aisle", col, 4);
        g.addNode(cId, "South Aisle " + cId, "aisle", col, 7);
    }

    // Entrance connections
    g.addUndirectedEdge("ENTRANCE", "A1", 4);
    g.addUndirectedEdge("ENTRANCE", "B1", 10);

    // Horizontal Aisle Segments (6 meters between adjacent columns)
    for (int col = 1; col < 5; ++col) {
        std::string next = std::to_string(col + 1);
        std::string curr = std::to_string(col);
        g.addUndirectedEdge("A" + curr, "A" + next, 6);
        g.addUndirectedEdge("B" + curr, "B" + next, 6);
        g.addUndirectedEdge("C" + curr, "C" + next, 6);
    }

    // Vertical Cross-Connectors creating realistic loops and alternate routes
    g.addUndirectedEdge("A1", "B1", 8);
    g.addUndirectedEdge("B1", "C1", 8);
    g.addUndirectedEdge("A2", "B2", 9);
    g.addUndirectedEdge("A3", "B3", 7);
    g.addUndirectedEdge("B3", "C3", 7);
    g.addUndirectedEdge("B4", "C4", 8);
    g.addUndirectedEdge("A5", "B5", 9);
    g.addUndirectedEdge("B5", "C5", 9);

    // 3. 25 Parking Slot Nodes (P01..P25) connected to adjacent aisle junctions
    for (int row = 0; row < 5; ++row) {
        for (int col = 0; col < 5; ++col) {
            int slotNum = row * 5 + col + 1;
            std::ostringstream oss;
            oss << "P" << std::setw(2) << std::setfill('0') << slotNum;
            std::string slotId = oss.str();

            int x = col + 1;
            int y = (row < 2) ? (row == 0 ? 0 : 2) : ((row < 4) ? (row == 2 ? 3 : 5) : 6);
            g.addNode(slotId, "Slot " + slotId, "slot", x, y);

            std::string colStr = std::to_string(col + 1);
            if (row == 0) {
                g.addUndirectedEdge(slotId, "A" + colStr, 2);
            } else if (row == 1) {
                g.addUndirectedEdge(slotId, "A" + colStr, 3);
            } else if (row == 2) {
                g.addUndirectedEdge(slotId, "B" + colStr, 2);
            } else if (row == 3) {
                g.addUndirectedEdge(slotId, "B" + colStr, 3);
            } else {
                g.addUndirectedEdge(slotId, "C" + colStr, 2);
            }
        }
    }

    return g;
}
