import Graph from "graphology";
import unitsTxt from '$lib/assets/units.txt';
import deps from '$lib/assets/dependencies.txt';

function loadUnits(): Graph {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", unitsTxt, false );
    xmlHttp.send( null );
    

    const graph = new Graph();
    for (const fqn of xmlHttp.responseText.split("\n").slice(1)) {
        if ( 
            /Test$/.test(fqn)
            || /\\Test\\/.test(fqn)
            || /SwagTest/.test(fqn)
            || /Shopware.Core.Framework.Log.Package/.test(fqn)
            || /Context$/.test(fqn)
            || /Entity$/.test(fqn)
            || /EntityRepository$/.test(fqn)
            || /Definition$/.test(fqn)
            || /Collection$/.test(fqn)
            || /^Shopware\\Core\\DevOps\\/.test(fqn)
            || /^Shopware\\Core\\Framework\\DataAbstractionLayer\\Search/.test(fqn)
            || /Defaults$/.test(fqn)
            || /ShopwareHttpException$/.test(fqn)
            || /^Shopware\\Core\\Framework\\Struct/.test(fqn)
            || /Uuid$/.test(fqn)
            || /Feature$/.test(fqn)
           ) {
               continue;
           }
           const name = fqn.split("\\").pop();
           graph.mergeNode(fqn, {name: name});
    }
    return graph;
}


function loadEdges(graph: Graph): void {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", deps, false );
    xmlHttp.send( null );
    const data = xmlHttp.responseText;

    for (const line of data.split("\n")) {
        const parts: string[] = line.split(",").map((p: string) => p.trim());
        if (parts.length < 2) {
            continue;
        }

        const self = parts[0];
        if (!graph.hasNode(self)) {
            continue;
        }

        if (parts[1] != "") {
            graph.setNodeAttribute(self, "package", parts[1]);
        }

        for (const vertex of parts.slice(2)) {
            if (!graph.hasNode(vertex) || vertex == self || vertex == "") {
                continue;
            }
            graph.mergeEdge(self, vertex);
        }
    }
    const loneNodes = graph.filterNodes((node: string) => graph.degree(node) == 0);
    loneNodes.forEach((node: string) => graph.dropNode(node));
}

export interface UnitGraph {
    graph: Graph;
    getPackages(): Set<string>;
}

export function newUnitGraph(): UnitGraph {
    const graph = loadUnits();
    loadEdges(graph);
    const packages: Set<string> = graph.nodes().reduce((acc: Set<string>, node: string) => {
        const pkg = graph.getNodeAttribute(node, "package");
        if (pkg) {
            acc.add(pkg);
        }
        return acc;
    }, new Set<string>());
    return {
        graph: graph,
        getPackages: () => {
            return packages;
        }
    };
}
