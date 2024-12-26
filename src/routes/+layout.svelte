
<script>
	//import "../application/styles.css";
	import "./styles.css";

	let { children } = $props();
</script>

{#if children}
	{@render children()}
{/if}
