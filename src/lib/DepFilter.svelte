<script lang="ts">
    import { createEventDispatcher } from 'svelte';
	import { DepFilter } from "./depfilter";

    export let packages: string[] = [];

    let source = packages[0];
    let target = "*";

    let filters: DepFilter[] = [];

    const dispatch = createEventDispatcher();


    function addFilter() {
        filters.push(new DepFilter(source, target));
        filters = filters;
        dispatch("newFilters", filters);
    }

    function reset() {
        filters = [];
        dispatch("newFilters", filters);
    }
    function removeFilter(pos: number) {
        filters.splice(pos, 1);
        filters = filters;
        dispatch("newFilters", filters);
    }
</script>

<div class="columns-1 p-4">
    <div>
        <button class="p-1 mb-2 rounded bg-background-light border-solid border-divider" on:click={reset}>Reset</button>
        <div class="p-1 mx-2 mb-4 rounded bg-background-light">
            <select name="source" bind:value={source}>
                {#each packages as pkg}
                    <option value={pkg}>{pkg}</option>
                {/each}
                <option value="*">*</option>
            </select>
            <select name="target" bind:value={target}>
                {#each packages as pkg}
                    <option value={pkg}>{pkg}</option>
                {/each}
                <option value="*">*</option>
            </select>
            <button class="p-1 ml-2 rounded bg-add" on:click={addFilter}>Add filter</button>
        </div>
    </div>
    <h2> Filters: </h2>
    {#each filters as filter, i}
        <div class="p-1 m-2 rounded flex flex-row items-stretch bg-background-light">
            <div class="p-1 flex-grow align-middle">
                <span class="font-bold">{filter.source}</span> to <span class="font-bold">{filter.target}</span>
            </div>
            <button class="p-1 basis-8 flex-none rounded bg-delete" on:click={()=> removeFilter(i)}>X</button>
        </div>
    {/each}
</div>
