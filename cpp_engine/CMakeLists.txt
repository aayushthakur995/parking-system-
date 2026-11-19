cmake_minimum_required(VERSION 3.16)
project(ParkSmartEngine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(park_smart_engine
    main.cpp
    Graph.cpp
    Dijkstra.cpp
    GreedyRecommendation.cpp
    TSP.cpp
    BranchBound.cpp
)
