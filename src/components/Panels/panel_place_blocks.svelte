<script>
	import InputTable from "../InputTable.svelte";
	import { gameUI } from "../../application/Main";

	let infoList = $state([]);
	function update_template_list_callback(list) { infoList = list; console.log(list); }

	gameUI.update_template_list_callback = update_template_list_callback;
	gameUI.update_template_list();
</script>

<div>
	<InputTable {...gameUI.table_place_blocks} />
</div>
