/**
 * This is a minimal example of sigma. You can use it as a base to write new
 * examples, or reproducible test cases for new issues, for instance.
 */

import Graph from "graphology";
import Sigma from "sigma";
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';

let xmlHttp = new XMLHttpRequest();
xmlHttp.open( "GET", "/dependencies.csv", false );
xmlHttp.send( null );
const data = xmlHttp.responseText;


xmlHttp = new XMLHttpRequest();
xmlHttp.open( "GET", "/units.txt", false );
xmlHttp.send( null );

const units = xmlHttp.responseText.split("\n")
.slice(1)
.reduce((map, line) => {
    if (/Test$/.test(line)) {
        return map;
    } 
    map.add(line);
    return map;
},
    new Set()
);

const edges = data.split("\n").
reduce((edges: [string, string][], line) => {
    const parts = line.split(",").map(p => p.trim());
    if (parts.length == 0 || /.php$/.test(parts[0])) {
        return edges;
    }

    const self = parts[0];
    if (!units.has(self)) {
        return edges;
    }

    for (const vertex of parts.slice(2)) {
        if (!units.has(vertex) || vertex == self) {
            continue;
        }
        edges.push([self, vertex]);
    }

    return edges;
},[]);


const container = document.getElementById("sigma-container") as HTMLElement;
const graph = new Graph();

let i = 0;
for (let unit of units) {
    let colorMap: { regex: RegExp, color: string}[] = [
        { regex: /Interface$/, color: "green" },
        { regex: /Trait$/, color: "blue" },
        { regex: /Controller$/, color: "red" },
        { regex: /Migration[0-9]+/, color: "#EEEEff" },
        { regex: /Event$/, color: "#00EEEE" },
        { regex: /Subscriber$/, color: "#EEEE00" },
        { regex: /Listener/, color: "#EEEE00" },
    ];
    
    let color = "gray";

    for (const map of colorMap) {
        if (map.regex.test(unit as string)) {
            color = map.color;
            break;
        }
    }

    graph.addNode(unit, { x: Math.sin(i), y: Math.cos(i), size: 5, label: unit, color: color });
    i++;
}

for (const edge of edges) {
    graph.addEdge(edge[0], edge[1]);
}

//forceAtlas2.assign(graph, 50);
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const renderer = new Sigma(graph, container);
renderer.on("clickNode", ({ node }) => console.log("node", node, graph.neighbors(node)));
