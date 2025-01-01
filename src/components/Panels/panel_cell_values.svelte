<script>
	import InputTable from "../InputTable.svelte";
	import { main } from "../../application/Main";
</script>

<div>
	<InputTable {...main.gameUI.table_setval} />
</div>
