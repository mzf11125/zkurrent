import { StateGraph } from "@langchain/langgraph";
import { AgentState } from "./types.js";
import { screenNode, routeAfterScreen } from "./nodes/screen.js";
import { decideNode } from "./nodes/decide.js";
import { executeNode } from "./nodes/execute.js";
import { monitorNode, routeAfterMonitor } from "./nodes/monitor.js";
import { learnNode } from "./nodes/learn.js";

export function buildZKurrentGraph() {
  const workflow = new StateGraph(AgentState)
    // ── Nodes ──
    .addNode("screen", screenNode)
    .addNode("decide", decideNode)
    .addNode("execute", executeNode)
    .addNode("monitor", monitorNode)
    .addNode("learn", learnNode)

    // ── Edges ──
    .addEdge("__start__", "screen")
    .addConditionalEdges("screen", routeAfterScreen)
    .addEdge("decide", "execute")
    .addEdge("execute", "monitor")
    .addConditionalEdges("monitor", routeAfterMonitor)
    .addEdge("learn", "screen");

  return workflow.compile();
}

export type ZKurrentGraph = ReturnType<typeof buildZKurrentGraph>;
