<script>
import "../app.css";
</script>

<style lang="postcss">
  :global(html) {
    background-color: theme(colors.background);
    color: theme(colors.text);
  }
</style>

<div class="flex flex-flow h-full">
    <nav class="basis-1/12 mr-8 border-solid border-2 border-divider">
        <a class="p1" href="/">Dependency graph</a>
        <a class="p1" href="/package-deps">Package deps experiment</a>
    </nav>
    <div class="basis-11/12">
        <slot/>
    </div>
</div>
