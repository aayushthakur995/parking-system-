#include "GreedyRecommendation.h"
#include "Dijkstra.h"
#include <algorithm>
#include <cmath>
#include <limits>

std::vector<RankedSlotResult> GreedyRecommendation::rankSlots(
    const Graph& graph,
    const std::string& entranceNode,
    const std::vector<CandidateSlotInput>& candidates,
    double distanceWeight,
    double priceWeight
) {
    std::vector<RankedSlotResult> results;
    if (candidates.empty()) {
        return results;
    }

    // Normalize weights so they always sum to 1.0
    double weightSum = distanceWeight + priceWeight;
    if (weightSum <= 0.0) {
        distanceWeight = 0.5;
        priceWeight = 0.5;
    } else {
        distanceWeight /= weightSum;
        priceWeight /= weightSum;
    }

    int minDist = std::numeric_limits<int>::max();
    int maxDist = std::numeric_limits<int>::min();
    int minPrice = std::numeric_limits<int>::max();
    int maxPrice = std::numeric_limits<int>::min();

    // Step 1: Run Dijkstra from entrance to each feasible candidate slot
    for (const auto& c : candidates) {
        DijkstraResult dRes = Dijkstra::findShortestPath(graph, entranceNode, c.graphNodeId);
        if (!dRes.reachable) {
            continue;
        }

        RankedSlotResult item;
        item.slotId = c.slotId;
        item.slotType = c.slotType;
        item.status = c.status;
        item.distance = dRes.shortestDistance;
        item.price = c.price;
        item.normDistance = 0.0;
        item.normPrice = 0.0;
        item.score = 0.0;
        item.route = dRes.path;

        minDist = std::min(minDist, item.distance);
        maxDist = std::max(maxDist, item.distance);
        minPrice = std::min(minPrice, item.price);
        maxPrice = std::max(maxPrice, item.price);

        results.push_back(std::move(item));
    }

    // Step 2: Min-Max normalization and weighted greedy score computation
    // Score = (distanceWeight * normDistance) + (priceWeight * normPrice)
    for (auto& item : results) {
        if (maxDist > minDist) {
            item.normDistance = static_cast<double>(item.distance - minDist) / static_cast<double>(maxDist - minDist);
        } else {
            item.normDistance = 0.0;
        }

        if (maxPrice > minPrice) {
            item.normPrice = static_cast<double>(item.price - minPrice) / static_cast<double>(maxPrice - minPrice);
        } else {
            item.normPrice = 0.0;
        }

        item.score = (distanceWeight * item.normDistance) + (priceWeight * item.normPrice);
    }

    // Step 3: Sort ascending (lower weighted score = better recommendation)
    std::sort(results.begin(), results.end(), [](const RankedSlotResult& a, const RankedSlotResult& b) {
        if (std::fabs(a.score - b.score) > 1e-9) {
            return a.score < b.score;
        }
        if (a.distance != b.distance) {
            return a.distance < b.distance;
        }
        if (a.price != b.price) {
            return a.price < b.price;
        }
        return a.slotId < b.slotId;
    });

    return results;
}
