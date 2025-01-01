<script>
	import InputTable from "../InputTable.svelte";
	import { main } from "../../application/Main";

	let infoList = $state([]);
	function update_template_list_callback(list) { infoList = list; console.log(list); }

	main.gameUI.update_template_list_callback = update_template_list_callback;
</script>

<div>
	<InputTable {...main.gameUI.table_place_blocks} />
</div>
