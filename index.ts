import Graph from "graphology";
import Sigma from "sigma";
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';
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
    if (parts.length == 0) {
        return edges;
    }

    const self = parts[0];
    if (!units.has(self)) {
        return edges;
    }

    unitPackages.set(self, parts[1]);
    packagesList.add(parts[1]);

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
    graph.forEachNode((node) => {
        const pkg = unitPackages.get(node)??'';
        const color = packageColors.get(pkg) as string;
        graph.setNodeAttribute(node, "color", color);
    });
};
uiLegend.appendChild(div);


const select = (pkg: string) => {
    const activeColor = packageColors.get(pkg) as string;
    const inactiveColor = "gray";
    graph.forEachNode((node) => {
        if (unitPackages.get(node) == pkg) {
            graph.setNodeAttribute(node, "color", activeColor);
        } else {
            graph.setNodeAttribute(node, "color", inactiveColor);
        }
    });
}

for (let [pkg, color] of packageColors.entries()) {
    const div = document.createElement("button");
    div.style.backgroundColor = color;
    div.style.color = "white";
    div.style.padding = "0.5em";
    div.style.margin = "0.5em";
    div.style.borderRadius = "0.5em";
    div.style.width = "100%";
    console.log(pkg);
    div.innerText = pkg;
    div.onclick = () => select(pkg);
    uiLegend.appendChild(div);
}


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
console.log(output);
renderer.on("clickNode", ({ node }) => {
    output.value = "";
    graph.neighbors(node).forEach((n => {
        graph.setNodeAttribute(n, "color", "red");
        output.value += n + "\n";
    }));
});

