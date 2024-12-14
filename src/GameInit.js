
class GameInit {
	static init() {
		// load block data.
		gameData.importTemplates(JSON.stringify(TEST_BLOCKS_OBJECT));
		// set root block.
		let templateId = null;
		for(const tid of gameData.blockTemplates.keys()) { templateId = tid; break; }
		gameData.setRootBlockTemplate(templateId);
	}
};



