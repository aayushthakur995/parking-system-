#ifndef GREEDY_RECOMMENDATION_H
#define GREEDY_RECOMMENDATION_H

#include "Graph.h"
#include <string>
#include <vector>

struct CandidateSlotInput {
    std::string slotId;
    std::string graphNodeId;
    int price;
    std::string slotType;
    std::string status;
};

struct RankedSlotResult {
    std::string slotId;
    std::string slotType;
    std::string status;
    int distance;
    int price;
    double normDistance;
    double normPrice;
    double score;
    std::vector<std::string> route;
};

class GreedyRecommendation {
public:
    static std::vector<RankedSlotResult> rankSlots(
        const Graph& graph,
        const std::string& entranceNode,
        const std::vector<CandidateSlotInput>& candidates,
        double distanceWeight,
        double priceWeight
    );
};

#endif // GREEDY_RECOMMENDATION_H
