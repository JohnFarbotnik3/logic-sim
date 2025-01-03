<script>
	import Input from "../Input.svelte";
	import InputArea from "../InputArea.svelte";
	import InputTable from "../InputTable.svelte";
	import Button from "../Button.svelte";
	import Grid from "../Grid.svelte";
	import FlexCol from "../FlexCol.svelte";
	import { main } from "../../application/Main";

	const gameUI = main.gameUI;
	const name_params = gameUI.input_root_template_name;
	const desc_params = gameUI.input_root_template_desc;
	const name_props = {...name_params.input, style:name_params.style};
	const desc_props = {...desc_params.input, style:desc_params.style};
	const oncancel = () => gameUI.root_template_oncancel.call(gameUI);
	const onsubmit = () => gameUI.root_template_onsubmit.call(gameUI);

</script>

<div>
	<div class="outline" style="margin:5px; padding:5px;">
		<Input		{...name_props} />
		<InputArea	{...desc_props} />
	</div>
	<InputTable	{...gameUI.table_root_template} />
	<Grid cols="1fr 1fr" style="margin:5px; width:unset;">
		<Button onclick={oncancel} class="outline" style="width:unset;">Cancel</Button>
		<Button onclick={onsubmit} class="outline" style="width:unset;">Submit</Button>
	</Grid>
</div>
