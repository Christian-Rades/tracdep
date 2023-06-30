<script lang="ts">
    // @ts-ignore
    import { instance } from "@viz-js/viz";
    import { newUnitGraph } from '$lib/input';
	import Graph from "graphology";
	import type { Attributes } from "graphology-types";
	import DepFilter from "$lib/DepFilter.svelte";
	import { onMount } from "svelte";

    let graph: SVGElement;
    let container: HTMLDivElement;

    const uGraph = newUnitGraph();
    const packages = Array.from(uGraph.getPackages().keys());


    const packageGraph = new Graph();

    uGraph.graph.forEachNode((_node: string, attributes: Partial<Attributes>) => {
        if (attributes.package) {
            packageGraph.mergeNode(attributes.package, {name: attributes.package});
        }
    });

    uGraph.graph.forEachEdge((_e, _eAttrs, _s, _t, sAttrs, tAttrs) => {
        if (sAttrs.package && tAttrs.package) {
            packageGraph.updateEdge(sAttrs.package, tAttrs.package, (attributes) => {
                return {
                    ...attributes,
                    weight: (attributes.weight || 0) + 1
                };
            });
        }
    });

    function renderGraph(filters: DepFilter[]){

        const outBuffer: string[] = [];

        outBuffer.push("digraph {");

        packageGraph.forEachNode((node: string, attributes) => {
            outBuffer.push(`"${node}" [shape="box", label="${node}"];`);
        });

        const colorMap = {
            ignored: "gray",
            intresting: "black",
            forbidden: "red",
        };

        packageGraph.forEachEdge((_edge, attributes, source, target) => {
            if (source === target) {
                return;
            }
            const isForbidden = filters.reduce((acc, filter) => {
                if (acc || filter.match(source, target)) {
                    return true;
                }
                return acc;
            }, false);

            let color = colorMap.ignored;

            let invis = "";
            if (isForbidden) {
                color = colorMap.forbidden;
            } else if (filters.length > 0) {
                invis = ', style=invis';
            }

            outBuffer.push(`"${source}" -> "${target}" [color="${color}" ${invis}, label="${attributes.weight}"];`);
        });

        outBuffer.push("}");


        instance().then(function(viz: any) {
            container.innerHTML = "";
            const svg: SVGElement = viz.renderSVGElement(outBuffer.join("\n"));
            svg.setAttribute("class", "w-full h-full");
            container.append(svg);
        });
    }

    onMount(() => {
        renderGraph([]);
    });
</script>

<div class="flex flex-row">
    <div class="basis-3/4" bind:this={container}>
    </div>
    <div class="basis-1/4">
        <DepFilter packages={packages} on:newFilters={ev => renderGraph(ev.detail)}/>
    </div>
</div>

