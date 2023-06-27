<script lang="ts">
    import forceAtlas2 from 'graphology-layout-forceatlas2';
    import FA2Layout from 'graphology-layout-forceatlas2/worker';
	import SigmaGraph from "../lib/SigmaGraph.svelte";
    import {newUnitGraph} from "../lib/input";
	import type { Attributes } from 'graphology-types';
	import Palette from 'iwanthue/palette';
    import type { RenderState } from "../lib/graphRenderState";

    const uGraph = newUnitGraph();
    const graph = uGraph.graph;

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
</script>

<div style="display: grid; height: 100%; grid-template-columns: 70% 1fr;">
    <SigmaGraph graph={uGraph} palette={palette} renderState={renderState}/>
    <div style="display: grid; grid-template-rows: 1fr 60px 3fr;">
        <div id="legend" style="display: grid; grid-template-columns: 1fr 1fr;">
            <button on:click={resetSelectedPackage} style="background-color: {palette.defaultColor};">
                reset
            </button>
            {#each packageNames as pkg}
                <button on:click={() => setSelectedPackage(pkg)} style="background-color: {palette.get(pkg)};">
                {pkg}
                </button>
            {/each}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr;">
            <button on:click={start} style="height: 100%">Start layouting</button>
            <button on:click={stop} style="height: 100%">Stop layouting</button>
        </div>
        <textarea id="output" style="width: 100%; height: 100%;">
        </textarea>
    </div>
</div>

