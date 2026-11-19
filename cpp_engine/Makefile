CXX := g++
CXXFLAGS := -std=c++17 -O2 -Wall -Wextra

SRCS := main.cpp Graph.cpp Dijkstra.cpp GreedyRecommendation.cpp TSP.cpp BranchBound.cpp
TARGET := park_smart_engine

all: $(TARGET)

$(TARGET): $(SRCS)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SRCS)

clean:
	rm -f $(TARGET)

.PHONY: all clean
