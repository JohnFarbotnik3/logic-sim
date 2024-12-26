
<script>
	import { b_value } from "./Test.js";
	let a = $state(0);
	let b = $state(b_value);
</script>

<div>
	test div
	<button onclick={() => a+=1}>clicks: {a}</button>
	<button onclick={() => b+=1}>clicks: {b}</button>
</div>
