<script>
	import InputTable from "../InputTable.svelte";
	import { gameUI } from "../../application/Main";
</script>

<style>

</style>

<div>
	<InputTable {...gameUI.table_select_cells} />
	<InputTable {...gameUI.table_select_blocks} />
</div>
