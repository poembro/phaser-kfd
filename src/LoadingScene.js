import kingPNG from "./assets/sprites/king.png";
import kingAtlasPNG from "./assets/spritesheets/a-king_withmask.png";
import kingAtlasJSON from "./assets/spritesheets/a-king_atlas.json";

import lizardAtlasPNG from "./assets/spritesheets/lizard.png";
import lizardAtlasJSON from "./assets/spritesheets/lizard.json";

import GrassPNG from "./assets/tilemaps/json/Grass.png";
 
import level1JSON from "./assets/tilemaps/json/level-1.json"; 
import GrassJSON from "./assets/tilemaps/json/Grass.json";


import WaterPNG from "./assets/spritesheets/Water.png";

import foodPNG from "./assets/spritesheets/food.png";

export class LoadingScene extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        //this.load.baseURL = "http://localhost:8080/assets/";
        this.load.image("king", kingPNG);

        // 加载图集：.atlas(key [, textureURL] [, atlasURL] [, textureXhrSettings] [, atlasXhrSettings])
        this.load.atlas(
            "a-king",
            kingAtlasPNG,
            kingAtlasJSON
          );
        this.load.atlas(
            "lizard", // 蜥蜴 
            lizardAtlasPNG,
            lizardAtlasJSON
        );

        // MAP LOADING
        this.load.image("Grass", GrassPNG)// 图块图片。 
     
        this.load.tilemapTiledJSON("Level-1", level1JSON);
        this.load.tilemapTiledJSON("Level-2", GrassJSON);
    
        this.load.spritesheet("water", WaterPNG, {
            frameWidth: 64,
            frameHeight: 16,
        });
    
        this.load.spritesheet("food", foodPNG, {
            frameWidth: 32,
            frameHeight: 32,
        });    
    }

    create() {
        this.scene.start("game-scene", {
            name: "Level-1",
          });
        this.scene.start("ui-scene", {
            name: "Level-1",
        });
    }
}
