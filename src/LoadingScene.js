import kingPNG from "./assets/sprites/king.png";


import kingAtlasPNG from "./assets/spritesheets/a-king_withmask.png";
import kingAtlasJSON from "./assets/spritesheets/a-king_atlas.json";


import lizardAtlasPNG from "./assets/spritesheets/lizard.png";
import lizardAtlasJSON from "./assets/spritesheets/lizard.json";

import GrassPNG from "./assets/tilemaps/json/Grass.png";
 
// tiled 软件导出的json 地图
import level1JSON from "./assets/tilemaps/json/level-1.json"; 
import Level2JSON from "./assets/tilemaps/json/Grass.json";


import backgroundPNG from "./assets/spritesheets/background.png"
import foodPNG from "./assets/spritesheets/food.png"

export class LoadingScene extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() { 
        //this.load.baseURL = "http://localhost:8080/assets/";
        this.load.image("king", kingPNG);

        // 加载图集：.atlas(key [, textureURL] [, atlasURL] [, textureXhrSettings] [, atlasXhrSettings])
        this.load.atlas("a-king", kingAtlasPNG, kingAtlasJSON) // 玩家
        this.load.atlas("lizard", lizardAtlasPNG,lizardAtlasJSON) // 蜥蜴 

        // MAP LOADING
        this.load.image("Grass", GrassPNG)// 图块图片。 
     
        // 读取assets/sprites/fire.json文件，并命名为fire，第三个参数则是图片的路径
        // this.load.multiatlas('fire', 'assets/sprites/fire.json', 'assets/sprites')


        this.load.tilemapTiledJSON("Level-1", level1JSON);
        this.load.tilemapTiledJSON("Level-2", Level2JSON);
    
        this.load.spritesheet("background", backgroundPNG, {frameWidth: 64, frameHeight: 16})
        this.load.spritesheet("food", foodPNG, {frameWidth: 32, frameHeight: 32})
    }

    create() {
        this.scene.start("game-scene", {name: "Level-1"});
        this.scene.start("ui-scene", {name: "Level-1"});
    }
}
