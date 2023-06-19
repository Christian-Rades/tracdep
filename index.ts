import Graph from "graphology";
import Sigma from "sigma";
import { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types"; 
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';
import * as colorMap from './colorMap';

import { newUnitGraph, UnitGraph } from "./input";
import { parseLayersConfig, LayersConfig } from "./layers";

const unitGraph = newUnitGraph();


function createColorMap(graph: UnitGraph): Map<string, string> {
    const packages = Array.from(graph.getPackages());

    const colors = colorMap.default({
        colormap: 'jet',
        nshades: packages.length,
        format: 'hex',
        alpha: 1
    }).values();

    const packageColors=new  Map<string, string>();

    for (let pkg of packages) {
        packageColors.set(pkg, colors.next().value);
    }
    return packageColors;
}

const packageColors = createColorMap(unitGraph);

// Type and declare internal state:
interface State {
  pinnend: boolean;
  hoveredNode?: string;
  selectedPackage?: string;

  // State derived from hovered node:
  hoveredNeighbors?: Set<string>;

  //filter state
  layersConfig?: LayersConfig;
  
}
const state: State = {pinnend: false};

let i = 0;
unitGraph.graph.forEachNode((node: string, attributes) => {
    attributes.x = Math.sin(i);
    attributes.y = Math.cos(i);
    attributes.size = 5;
    attributes.label = node;
    attributes.color = packageColors.get(attributes.package??'') as string;
    i++;
});


const sensibleSettings = forceAtlas2.inferSettings(unitGraph.graph);
const layout = new FA2Layout(unitGraph.graph, {
  settings: sensibleSettings
});

// To start the layout
layout.start();

// To stop the layout
setTimeout(() => {
layout.stop();
}, 20000);


function newRenderer(graph: Graph, state: State): Sigma {
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


    // Render nodes accordingly to the internal state:
    // If there is a hovered node, all non-neighbor nodes are greyed
    renderer.setSetting("nodeReducer", (node, data) => {
        const res: Partial<NodeDisplayData> = { ...data };

        if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
            res.label = "";
            res.color = "#f6f6f6";
            return res;
        }

        const pkg = graph.getNodeAttribute(node, 'package')??'';
        if(!!state.selectedPackage) {
            if (pkg != state.selectedPackage) {
                res.label = "";
                res.color = "#f6f6f6";
            } else {
                const color = packageColors.get(pkg) as string;
                res.color = color;
            }
        }else {
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
    return renderer;
}

const renderer = newRenderer(unitGraph.graph, state);


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

const uiLayers = document.getElementById("layers") as HTMLTextAreaElement;

uiLayers.oninput = () => {
    const layers = parseLayersConfig(uiLayers.value);
    state.layersConfig = layers;
    
    const output = document.getElementById("output") as HTMLTextAreaElement;
    output.value = "";
    output.value += JSON.stringify(layers, null, 2);
}

interface Cluster {
  label: string;
  x?: number;
  y?: number;
  color?: string;
  positions: { x: number; y: number }[];
}

// initialize clusters from graph data
const countryClusters: { [key: string]: Cluster } = {};


const uiApply = document.getElementById("apply") as HTMLButtonElement;
uiApply.onclick = () => {
    if (!state.layersConfig) {
        return;
    }
    newRenderer(state.layersConfig.apply(unitGraph.graph), state);

unitGraph.graph.forEachNode((node, atts) => {
  const cluster = countryClusters[atts.country];
  // node color depends on the cluster it belongs to
  atts.color = cluster.color;
  // node size depends on its degree
  atts.size = Math.sqrt(unitGraph.graph.degree(node)) / 2;
  // store cluster's nodes positions to calculate cluster label position
  cluster.positions.push({ x: atts.x, y: atts.y });
});

// calculate the cluster's nodes barycenter to use this as cluster label position
for (const country in countryClusters) {
  countryClusters[country].x =
    countryClusters[country].positions.reduce((acc, p) => acc + p.x, 0) / countryClusters[country].positions.length;
  countryClusters[country].y =
    countryClusters[country].positions.reduce((acc, p) => acc + p.y, 0) / countryClusters[country].positions.length;
}

// create the clustersLabel layer
const clustersLayer = document.createElement("div");
clustersLayer.id = "clustersLayer";
let clusterLabelsDoms = "";
for (const country in countryClusters) {
  // for each cluster create a div label
  const cluster = countryClusters[country];
  // adapt the position to viewport coordinates
  const viewportPos = renderer.graphToViewport(cluster as Coordinates);
  clusterLabelsDoms += `<div id='${cluster.label}' class="clusterLabel" style="top:${viewportPos.y}px;left:${viewportPos.x}px;color:${cluster.color}">${cluster.label}</div>`;
}
}
