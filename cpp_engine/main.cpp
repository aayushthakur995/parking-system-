#include "BranchBound.h"
#include "Dijkstra.h"
#include "Graph.h"
#include "GreedyRecommendation.h"
#include "TSP.h"
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <set>
#include <sstream>
#include <string>
#include <vector>

namespace {

std::string jsonEscape(const std::string& s) {
    std::ostringstream oss;
    for (char c : s) {
        if (c == '"') oss << "\\\"";
        else if (c == '\\') oss << "\\\\";
        else if (c == '\n') oss << "\\n";
        else oss << c;
    }
    return oss.str();
}

void printStringArray(const std::vector<std::string>& arr) {
    std::cout << "[";
    for (size_t i = 0; i < arr.size(); ++i) {
        if (i > 0) std::cout << ",";
        std::cout << "\"" << jsonEscape(arr[i]) << "\"";
    }
    std::cout << "]";
}

void printLegsArray(const std::vector<TSPLeg>& legs) {
    std::cout << "[";
    for (size_t i = 0; i < legs.size(); ++i) {
        if (i > 0) std::cout << ",";
        std::cout << "{"
                  << "\"from\":\"" << jsonEscape(legs[i].from) << "\","
                  << "\"to\":\"" << jsonEscape(legs[i].to) << "\","
                  << "\"distance\":" << legs[i].distance << ","
                  << "\"path\":";
        printStringArray(legs[i].path);
        std::cout << "}";
    }
    std::cout << "]";
}

std::vector<std::string> splitComma(const std::string& s) {
    std::vector<std::string> items;
    std::stringstream ss(s);
    std::string token;
    while (std::getline(ss, token, ',')) {
        if (!token.empty()) {
            items.push_back(token);
        }
    }
    return items;
}

std::string getArgValue(int argc, char* argv[], const std::string& prefix, const std::string& def = "") {
    for (int i = 1; i < argc; ++i) {
        std::string arg(argv[i]);
        if (arg.rfind(prefix, 0) == 0) {
            return arg.substr(prefix.size());
        }
    }
    return def;
}

void handleGraphMode(const Graph& graph) {
    auto nodeIds = graph.getAllNodeIds();
    const auto& metaMap = graph.getNodesMeta();
    const auto& adj = graph.getAdjacencyList();

    std::cout << "{";
    std::cout << "\"nodeCount\":" << nodeIds.size() << ",";
    std::cout << "\"nodes\":[";
    for (size_t i = 0; i < nodeIds.size(); ++i) {
        const auto& m = metaMap.at(nodeIds[i]);
        if (i > 0) std::cout << ",";
        std::cout << "{"
                  << "\"id\":\"" << jsonEscape(m.id) << "\","
                  << "\"label\":\"" << jsonEscape(m.label) << "\","
                  << "\"kind\":\"" << jsonEscape(m.kind) << "\","
                  << "\"x\":" << m.x << ","
                  << "\"y\":" << m.y
                  << "}";
    }
    std::cout << "],";

    // Deduplicate undirected edges (u < v)
    std::set<std::pair<std::string, std::string>> seen;
    struct FlatEdge { std::string u, v; int w; };
    std::vector<FlatEdge> edges;
    for (const auto& id : nodeIds) {
        for (const auto& e : adj.at(id)) {
            std::string a = std::min(id, e.to);
            std::string b = std::max(id, e.to);
            if (seen.insert({a, b}).second) {
                edges.push_back({a, b, e.weight});
            }
        }
    }

    std::cout << "\"edgeCount\":" << edges.size() << ",";
    std::cout << "\"edges\":[";
    for (size_t i = 0; i < edges.size(); ++i) {
        if (i > 0) std::cout << ",";
        std::cout << "{"
                  << "\"from\":\"" << jsonEscape(edges[i].u) << "\","
                  << "\"to\":\"" << jsonEscape(edges[i].v) << "\","
                  << "\"weight\":" << edges[i].w
                  << "}";
    }
    std::cout << "]";
    std::cout << "}\n";
}

void handleDijkstraMode(const Graph& graph, const std::string& src, const std::string& dst) {
    DijkstraResult res = Dijkstra::findShortestPath(graph, src, dst);
    std::cout << "{"
              << "\"algorithm\":\"Dijkstra (C++17)\","
              << "\"reachable\":" << (res.reachable ? "true" : "false") << ","
              << "\"source\":\"" << jsonEscape(res.source) << "\","
              << "\"destination\":\"" << jsonEscape(res.destination) << "\","
              << "\"shortestDistance\":" << res.shortestDistance << ","
              << "\"path\":";
    printStringArray(res.path);
    std::cout << ",\"exploredNodes\":";
    printStringArray(res.exploredNodes);
    std::cout << ",\"exploredCount\":" << res.exploredNodes.size()
              << "}\n";
}

void handleRecommendMode(const Graph& graph) {
    double distanceWeight = 0.5;
    double priceWeight = 0.5;
    std::string headerLine;
    if (std::getline(std::cin, headerLine) && !headerLine.empty()) {
        std::istringstream iss(headerLine);
        iss >> distanceWeight >> priceWeight;
    }

    std::vector<CandidateSlotInput> candidates;
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        std::stringstream ss(line);
        CandidateSlotInput item;
        std::string priceStr;
        std::getline(ss, item.slotId, '|');
        std::getline(ss, item.graphNodeId, '|');
        std::getline(ss, priceStr, '|');
        std::getline(ss, item.slotType, '|');
        std::getline(ss, item.status, '|');
        if (item.slotId.empty() || priceStr.empty()) continue;
        item.price = std::stoi(priceStr);
        candidates.push_back(std::move(item));
    }

    double wSum = distanceWeight + priceWeight;
    if (wSum <= 0.0) {
        distanceWeight = 0.5;
        priceWeight = 0.5;
    } else {
        distanceWeight /= wSum;
        priceWeight /= wSum;
    }

    auto ranked = GreedyRecommendation::rankSlots(graph, "ENTRANCE", candidates, distanceWeight, priceWeight);

    std::cout << std::fixed << std::setprecision(4);
    std::cout << "{"
              << "\"algorithm\":\"Dijkstra + Greedy Weighted Ranking (C++17)\","
              << "\"distanceWeight\":" << distanceWeight << ","
              << "\"priceWeight\":" << priceWeight << ","
              << "\"rankedSlots\":[";

    for (size_t i = 0; i < ranked.size(); ++i) {
        if (i > 0) std::cout << ",";
        const auto& r = ranked[i];
        std::cout << "{"
                  << "\"slotId\":\"" << jsonEscape(r.slotId) << "\","
                  << "\"slotType\":\"" << jsonEscape(r.slotType) << "\","
                  << "\"status\":\"" << jsonEscape(r.status) << "\","
                  << "\"distance\":" << r.distance << ","
                  << "\"price\":" << r.price << ","
                  << "\"normDistance\":" << r.normDistance << ","
                  << "\"normPrice\":" << r.normPrice << ","
                  << "\"score\":" << r.score << ","
                  << "\"route\":";
        printStringArray(r.route);
        std::cout << "}";
    }
    std::cout << "]}\n";
}

void printTSPJson(const TSPResult& tsp) {
    std::cout << "{"
              << "\"algorithm\":\"Brute Force TSP (C++17)\","
              << "\"valid\":" << (tsp.valid ? "true" : "false") << ","
              << "\"startNode\":\"" << jsonEscape(tsp.startNode) << "\","
              << "\"checkpoints\":";
    printStringArray(tsp.checkpoints);
    std::cout << ",\"optimalRoute\":";
    printStringArray(tsp.optimalRoute);
    std::cout << ",\"totalDistance\":" << tsp.totalDistance
              << ",\"toursEvaluated\":" << tsp.toursEvaluated
              << ",\"executionTimeUs\":" << tsp.executionTimeUs
              << ",\"legs\":";
    printLegsArray(tsp.legs);
    std::cout << "}";
}

void printBranchBoundJson(const BranchBoundResult& bb) {
    std::cout << "{"
              << "\"algorithm\":\"Branch and Bound TSP (C++17)\","
              << "\"valid\":" << (bb.valid ? "true" : "false") << ","
              << "\"startNode\":\"" << jsonEscape(bb.startNode) << "\","
              << "\"checkpoints\":";
    printStringArray(bb.checkpoints);
    std::cout << ",\"optimalRoute\":";
    printStringArray(bb.optimalRoute);
    std::cout << ",\"totalCost\":" << bb.totalCost
              << ",\"branchesExplored\":" << bb.branchesExplored
              << ",\"branchesPruned\":" << bb.branchesPruned
              << ",\"executionTimeUs\":" << bb.executionTimeUs
              << ",\"legs\":";
    printLegsArray(bb.legs);
    std::cout << ",\"traceSteps\":[";
    for (size_t i = 0; i < bb.traceSteps.size(); ++i) {
        if (i > 0) std::cout << ",";
        const auto& t = bb.traceSteps[i];
        std::cout << "{"
                  << "\"partialRoute\":";
        printStringArray(t.partialRoute);
        std::cout << ",\"currentCost\":" << t.currentCost
                  << ",\"lowerBound\":" << t.lowerBound
                  << ",\"bestCost\":" << t.bestCost
                  << ",\"action\":\"" << jsonEscape(t.action) << "\""
                  << "}";
    }
    std::cout << "]}";
}

} // namespace

int main(int argc, char* argv[]) {
    std::string mode = getArgValue(argc, argv, "--mode=", "graph");
    Graph graph = Graph::buildParkingLotGraph();

    if (mode == "graph") {
        handleGraphMode(graph);
    } else if (mode == "dijkstra") {
        std::string src = getArgValue(argc, argv, "--src=", "ENTRANCE");
        std::string dst = getArgValue(argc, argv, "--dst=", "P01");
        handleDijkstraMode(graph, src, dst);
    } else if (mode == "recommend") {
        handleRecommendMode(graph);
    } else if (mode == "tsp") {
        std::string start = getArgValue(argc, argv, "--start=", "ENTRANCE");
        std::string cpRaw = getArgValue(argc, argv, "--checkpoints=", "");
        auto checkpoints = splitComma(cpRaw);
        TSPResult tsp = TSP::solveBruteForce(graph, start, checkpoints);
        printTSPJson(tsp);
        std::cout << "\n";
    } else if (mode == "branch_bound") {
        std::string start = getArgValue(argc, argv, "--start=", "ENTRANCE");
        std::string cpRaw = getArgValue(argc, argv, "--checkpoints=", "");
        auto checkpoints = splitComma(cpRaw);
        TSPResult bf = TSP::solveBruteForce(graph, start, checkpoints);
        BranchBoundResult bb = BranchBound::solveTSP(graph, start, checkpoints);
        std::cout << "{\"bruteForce\":";
        printTSPJson(bf);
        std::cout << ",\"branchBound\":";
        printBranchBoundJson(bb);
        std::cout << "}\n";
    } else {
        std::cerr << "Unknown mode: " << mode << "\n";
        return 1;
    }

    return 0;
}
