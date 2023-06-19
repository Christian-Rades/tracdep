import Graph from "graphology";

type Attribute = "name"| "package"| "fqn";
const isAttribute = (x: string): x is Attribute => ["name", "package", "fqn"].includes(x);

export interface LayersConfig {
    layers: Layer[];
    apply(graph: Graph): Graph;
}

export interface Layer {
    name: string;
    attribute: Attribute;
    regex: RegExp;
}

export function parseLayersConfig(config: string): LayersConfig {
    const layers: Layer[] = [];
    for (const line of config.split("\n")) {
        const name = line.split(":")[0].trim();
        const attribute: Attribute = line.slice(line.indexOf(":")+1, line.indexOf("~")).trim() as Attribute;
        const regex = new RegExp(line.slice(line.indexOf("~")+1).trim());
        if (name == "" || !isAttribute(attribute) || regex == null) {
            continue;
        }
        layers.push({name: name, attribute: attribute, regex: regex});
    }
    return {
        layers: layers,
        apply: (graph: Graph): Graph => {
            const newGraph = new Graph();
            graph.forEachNode((node, oldAttrs) => {
                for (const layer of layers) {
                    const testVal = oldAttrs[layer.attribute] ?? node;
                    if (layer.regex.test(testVal)) {
                        newGraph.updateNode(layer.name, newAttrs => {
                            const updated = {...newAttrs};
                            updated.size = newAttrs.size ? newAttrs.size + 1 : 1;
                            updated.label = layer.name;
                            updated.x = updated["x"] ? updated.x + oldAttrs.x: oldAttrs.x;
                            updated.y = updated["y"] ? updated.y + oldAttrs.y: oldAttrs.y;
                            updated[oldAttrs.package] = newAttrs[oldAttrs.package] ? newAttrs[oldAttrs.package] + 1 : 1;
                            return updated;
                        });

                        break;
                    }
                }
            });

            graph.forEachNode((node, attrs) => {
                attrs.x = attrs.x / attrs.size;
                attrs.y = attrs.y / attrs.size;
            });
            return newGraph;
        }
    };
}
