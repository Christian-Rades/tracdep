import Graph from "graphology";
import Sigma from "sigma";
import { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types"; 
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';
import toSimple from 'graphology-operators/to-simple';
import * as colorMap from './colorMap';


let xmlHttp = new XMLHttpRequest();
xmlHttp.open( "GET", "/dependencies.csv", false );
xmlHttp.send( null );
const data = xmlHttp.responseText;


xmlHttp = new XMLHttpRequest();
xmlHttp.open( "GET", "/units.txt", false );
xmlHttp.send( null );

const units: Set<string> = xmlHttp.responseText.split("\n")
.slice(1)
.filter(line => !/Test$/.test(line))
.filter(line => !/\\Test\\/.test(line))
.filter(line => !/SwagTest/.test(line))
.filter(line => !/Shopware.Core.Framework.Log.Package/.test(line))
.filter(line => !/Context$/.test(line))
.reduce((set, name) => {
    set.add(name);
    return set;
},
    new Set<string>()
);

const packagesList = new Set<string>();
const unitPackages= new Map<string, string>();

const edges = data.split("\n").
reduce((edges: [string, string][], line) => {
    const parts = line.split(",").map(p => p.trim());
    if (parts.length < 2) {
        return edges;
    }

    const self = parts[0];
    if (!units.has(self)) {
        return edges;
    }

    if (parts[1] != "") {
        unitPackages.set(self, parts[1]);
        packagesList.add(parts[1]);
    }

    for (const vertex of parts.slice(2)) {
        if (!units.has(vertex) || vertex == self || vertex == "") {
            continue;
        }
        edges.push([self, vertex]);
    }

    return edges;
},[]);

const colors = colorMap.default({
    colormap: 'jet',
    nshades: packagesList.size,
    format: 'hex',
    alpha: 1
}).values();
const packageColors=new  Map<string, string>();
for (let pkg of packagesList) {
    packageColors.set(pkg, colors.next().value);
}


// Type and declare internal state:
interface State {
  pinnend: boolean;
  hoveredNode?: string;
  selectedPackage?: string;

  // State derived from hovered node:
  hoveredNeighbors?: Set<string>;
}
const state: State = {pinnend: false};




const graph = new Graph();

let i = 0;
for (let unit of units) {

    const pkg = unitPackages.get(unit)??'';
    let color = packageColors.get(pkg) as string;

    graph.addNode(unit, { x: Math.sin(i), y: Math.cos(i), size: 5, label: unit, color: color });
    i++;
}

for (const edge of edges) {
    graph.addEdge(edge[0], edge[1]);
}

const sensibleSettings = forceAtlas2.inferSettings(graph);
const layout = new FA2Layout(graph, {
  settings: sensibleSettings
});

// To start the layout
layout.start();

// To stop the layout
setTimeout(() => {
layout.stop();
}, 10000);


const container = document.getElementById("sigma-container") as HTMLElement;
const renderer = new Sigma(graph, container);


const output = document.getElementById("output") as HTMLTextAreaElement;
renderer.on("clickNode", ({ node }) => {
    state.pinnend = true;
    setHoveredNode(node);
    output.value = "";
    graph.neighbors(node).forEach((n => {
        output.value += n + "\n";
    }));
});

function setHoveredNode(node?: string) {
  if (node) {
    state.hoveredNode = node;
    state.hoveredNeighbors = new Set(graph.neighbors(node));
  } else {
    state.hoveredNode = undefined;
    state.hoveredNeighbors = undefined;
  }

  // Refresh rendering:
  renderer.refresh();
}

// Bind graph interactions:
renderer.on("enterNode", ({ node }) => {
  //setHoveredNode(node);
});
renderer.on("leaveNode", () => {
  //setHoveredNode(undefined);
});
renderer.on("clickStage", () => {
  state.pinnend = false;
  setHoveredNode(undefined);
});


const uiLegend = document.getElementById("legend") as HTMLElement;


const div = document.createElement("button");
div.style.backgroundColor = "gray";
div.style.color = "white";
div.style.padding = "0.5em";
div.style.margin = "0.5em";
div.style.borderRadius = "0.5em";
div.style.width = "100%";
div.innerText = "reset";
div.onclick = () => {
    state.selectedPackage = undefined;
  renderer.refresh();
};
uiLegend.appendChild(div);


const select = (pkg: string) => {
    state.selectedPackage = pkg;
  renderer.refresh();
}

for (let [pkg, color] of packageColors.entries()) {
    const div = document.createElement("button");
    div.style.backgroundColor = color;
    div.style.color = "white";
    div.style.padding = "0.5em";
    div.style.margin = "0.5em";
    div.style.borderRadius = "0.5em";
    div.style.width = "100%";
    console.log("what: ", pkg);
    div.innerText = pkg;
    div.onclick = () => select(pkg);
    uiLegend.appendChild(div);
}

// Render nodes accordingly to the internal state:
// If there is a hovered node, all non-neighbor nodes are greyed
renderer.setSetting("nodeReducer", (node, data) => {
  const res: Partial<NodeDisplayData> = { ...data };

  if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
    res.label = "";
    res.color = "#f6f6f6";
  }else if(!!state.selectedPackage) {
      const pkg = unitPackages.get(node)??'';
      if (pkg != state.selectedPackage) {
          res.label = "";
          res.color = "#f6f6f6";
      } else {
          const color = packageColors.get(pkg) as string;
          res.color = color;
      }
  }else {
    const pkg = unitPackages.get(node)??'';
    const color = packageColors.get(pkg) as string;
    res.color = color;
  }


  return res;
});

// Render edges accordingly to the internal state:
// 1. If a node is hovered, the edge is hidden if it is not connected to the
//    node
renderer.setSetting("edgeReducer", (edge, data) => {
  const res: Partial<EdgeDisplayData> = { ...data };

  if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
    res.hidden = true;
  }


  return res;
});
