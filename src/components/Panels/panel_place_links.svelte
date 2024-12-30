<script>
	import InputTable from "../InputTable.svelte";
	import { gameUI } from "../../application/Main";
</script>

<div>
	<InputTable {...gameUI.table_place_links} />
</div>
