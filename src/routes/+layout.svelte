<script>
	import "./styles.css";

	let { children } = $props();
</script>

{#if children}
	{@render children()}
{/if}
