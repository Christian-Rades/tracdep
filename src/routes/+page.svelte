<script lang="ts">
    import forceAtlas2 from 'graphology-layout-forceatlas2';
    import FA2Layout from 'graphology-layout-forceatlas2/worker';
	import SigmaGraph from "../lib/SigmaGraph.svelte";
    import {newUnitGraph} from "../lib/input";
	import type { Attributes } from 'graphology-types';
	import Palette from 'iwanthue/palette';
    import type { RenderState } from "../lib/graphRenderState";
	import NodeDetails from '$lib/NodeDetails.svelte';

    const uGraph = newUnitGraph();
    const graph = uGraph.graph;

    let selectedNode = "";

    let phase = 0;

    graph.forEachNode((_node: string, attrs: Partial<Attributes>) => {
        attrs.x = Math.sin(phase);
        attrs.y = Math.cos(phase);
        attrs.size = 5;
        phase++;
    });

    const packageNames = Array.from(uGraph.getPackages().keys());
    packageNames.sort();

    const palette = Palette.generateFromValues(
        'packages',
        packageNames,
        { colorSpace: 'sensible', attempts: 5 },
    );

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
    function start() {layout.start()};
    function stop() {layout.stop()};

    let renderState: RenderState = {};

    function resetSelectedPackage () {
        renderState.selectedPackage = undefined;
    }

    function setSelectedPackage(pkg: string) {
        renderState.selectedPackage = pkg;
    }
    function setSelection(node: string){
        selectedNode = node;
    }
    function unsetSelection(){
        selectedNode = "";
    }
</script>

<div class="flex flex-row">
    <div class="basis-3/4 flex-grow h-screen">
        <SigmaGraph on:clickedNode={(ev) => setSelection(ev.detail)} on:clickedStage={unsetSelection} graph={uGraph} palette={palette} renderState={renderState}/>
    </div>
    <div style="pl-4 basis-1/4 flex-none">
        <span class="col-span-2">Package colors</span>
        <div id="legend" class="grid grid-cols-2 gap-1">
            <button class="p-1 rounded" on:click={resetSelectedPackage} style="background-color: {palette.defaultColor};">
                reset
            </button>
            {#each packageNames as pkg}
                <button class="p-1 rounded" on:click={() => setSelectedPackage(pkg)} style="background-color: {palette.get(pkg)};">
                    {pkg}
                </button>
            {/each}
            <span class="col-span-2">Layouting controls</span>
            <button class="p-1 rounded bg-accept" on:click={start}>Start</button>
            <button class="p-1 rounded bg-delete" on:click={stop}>Stop</button>
        </div>
        <NodeDetails graph={uGraph} selectedNode={selectedNode}/>
    </div>
</div>

