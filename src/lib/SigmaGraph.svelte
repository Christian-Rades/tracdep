<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import Sigma from 'sigma';
    import type { UnitGraph } from './input';
    import type Palette from "iwanthue/palette";
    import type { EdgeDisplayData, NodeDisplayData } from 'sigma/types';
    import type { RenderState } from "../lib/graphRenderState";

    export let graph: UnitGraph;
    export let palette: Palette<unknown>;
    export let renderState: RenderState;

    let container: HTMLDivElement;
    let renderer: Sigma|undefined;
    const dispatch = createEventDispatcher();

    $: {
        renderState = renderState;
        renderer?.refresh()
    }


    onMount(() => {
        renderer = new Sigma(graph.graph, container);

        let selectedNeighbors: Set<string>|undefined;

        renderer.on("clickNode", ({ node }) => {
            renderState.selectedNode = node;
            selectedNeighbors = new Set(graph.graph.neighbors(node));
            dispatch('clickedNode', node);
        });
        renderer.on("clickStage", () =>{
            renderState.selectedNode = undefined
            selectedNeighbors = undefined;
            dispatch('clickedstage');
        });

        renderer.setSetting("nodeReducer", (node, data) => {
            const res: Partial<NodeDisplayData> = { ...data };
            const pkg = graph.graph.getNodeAttribute(node, 'package');
            const name = graph.graph.getNodeAttribute(node, 'name');
            if (renderState.selectedPackage === undefined || pkg == renderState.selectedPackage) {
                res.color = palette.get(pkg);
                res.label = name;
            } else {
                res.color = palette.defaultColor;
                res.label = "";
            }

            if (renderState.selectedNode && !(node === renderState.selectedNode || selectedNeighbors?.has(node))) {
                res.color = palette.defaultColor;
                res.label = "";
            }

            return res;
        });

        renderer.setSetting("edgeReducer", (edge, data) => {
            const res: Partial<EdgeDisplayData> = { ...data };
            if (renderState.selectedNode === undefined) {
                return res;
            }

            if (!graph.graph.hasExtremity(edge, renderState.selectedNode)) {
                res.hidden = true;
            }


            return res;
        });
    });
</script>

<style>
    #sigma-container {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    }

    #clustersLayer {
    width: 100%;
    height: 100%;
    position: absolute;
    }
    .clusterLabel {
    position: absolute;
    transform: translate(-50%, -50%);
    font-family: sans-serif;
    font-variant: small-caps;
    font-weight: 400;
    font-size: 1.8rem;
    text-shadow: 2px 2px 1px white, -2px -2px 1px white, -2px 2px 1px white, 2px -2px 1px white;
    }
</style>

<div id="sigma-container" bind:this={container}></div>
