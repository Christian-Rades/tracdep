<script lang="ts">
    import type { UnitGraph } from './input';

    export let selectedNode = "";
    export let graph: UnitGraph;

    let neighbors: string[] = [];

    const getNeighbors = (node: string): string[] =>  {
        if(selectedNode.length ===  0){
            return [];
        }

        const neighbors = graph.graph.neighbors(node);
        const prefix = "Shopware\\Core\\";
        return neighbors.map((item) =>  item.replace(prefix, ""));
    }

    $: neighbors = getNeighbors(selectedNode);
</script>

<div>
    <h2>Neighbors:</h2>
    <ol class="overflow-scroll max-h-60">
    {#each neighbors as neighbor}
        <ul>{neighbor}</ul>
    {/each}
    </ol>
</div>
