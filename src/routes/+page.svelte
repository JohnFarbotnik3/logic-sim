<script>
	import { main } from "../application/Main.js";

	main.init();
</script>

<link rel="stylesheet" href="../application/styles.css" />

<div id="container">
	<div id="header" class="pad outline"></div>
	<div id="middle">
		<div id="toolPanel" class="pad outline"></div>
		<div id="canvasWrapper" class="fit">
			<canvas id="canvas" width=800 height=600></canvas>
		</div>
	</div>
</div>
